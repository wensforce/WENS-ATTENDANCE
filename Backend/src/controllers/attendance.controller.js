import prisma from "../../lib/prisma.js";
import {
  getStartOfDay,
  getEndOfDay,
  getAttendanceStatus,
  extraTime,
  getUserShiftTimeInMinutes,
  isTodayWeekOff,
  formatDateOnly,
  calculateWorkHours,
} from "../utils/dateFormat.js";
import { batchPresignUrls, uploadFile } from "../services/storage.service.js";
import { success, error } from "../utils/response.js";
import { verifyLocation } from "../utils/verifyLocation.js";
import sendNotification from "../services/sendNotification.js";

export const getAllAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      startDate,
      endDate,
      userId,
    } = req.query;

    const where = {};

    // userId filter
    if (userId) {
      where.userId = parseInt(userId);
    }

    // date filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // search filter
    if (search) {
      where.OR = [
        { checkInLocation: { contains: search } },
        { checkOutLocation: { contains: search } },
        {
          user: {
            OR: [
              { employeeName: { contains: search } },
              ...(!isNaN(search) ? [{ employeeId: parseInt(search) }] : []),
            ],
          },
        },
      ];
    }

    const [attendanceRecords, totalCount] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { date: "desc" },
        select: {
          id: true,
          userId: true,
          checkoutOutside: true,
          date: true,
          status: true,
          checkInTime: true,
          checkOutTime: true,
          extraTime: true,
          // include user details
          user: {
            select: {
              id: true,
              employeeName: true,
              employeeId: true,
            },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    return success(res, 200, "Attendance records retrieved successfully", {
      attendanceRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        limit: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1,
      },
    });
  } catch (err) {
    console.error("Get all attendance error:", err);
    return error(res, 500, "Internal server error");
  }
};

export const getAllSpecialAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      startDate,
      endDate,
      userId,
    } = req.query;

    const where = {};

    // userId filter
    if (userId) {
      where.userId = parseInt(userId);
    }

    // date filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // search filter
    if (search) {
      where.OR = [
        { checkInLocation: { contains: search } },
        { checkOutLocation: { contains: search } },
        {
          user: {
            OR: [
              { employeeName: { contains: search } },
              ...(!isNaN(search) ? [{ employeeId: parseInt(search) }] : []),
            ],
          },
        },
      ];
    }

    const [attendanceRecords, totalCount] = await Promise.all([
      prisma.SpecialAttendance.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { date: "desc" },
        select: {
          id: true,
          userId: true,
          date: true,
          checkInTime: true,
          checkOutTime: true,
          workHours: true,
          // include user details
          user: {
            select: {
              id: true,
              employeeName: true,
              employeeId: true,
            },
          },
        },
      }),
      prisma.SpecialAttendance.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    return success(
      res,
      200,
      "Special Attendance records retrieved successfully",
      {
        attendanceRecords,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPreviousPage: parseInt(page) > 1,
        },
      },
    );
  } catch (err) {
    console.error("Get all special attendance error:", err);
    return error(res, 500, "Internal server error");
  }
};

export const checkIn = async (req, res) => {
  try {
    const userId = req.user.userId;
    const checkInImage = req.file;
    const { lat, lng, address } = req.body;
    const today = new Date();
    const startOfDay = getStartOfDay(today);
    const endOfDay = getEndOfDay(today);

    if (!checkInImage) {
      return error(res, 400, "Check-in image is required");
    }

    if (!lat || !lng) {
      return error(res, 400, "Check-in location is required");
    }

    const [existingAttendance, existingSpecialAttendance] = await Promise.all([
      // Check if user has already checked in today
      prisma.attendance.findFirst({
        where: {
          userId,
          checkInTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      // check if user has already checked in for special duty today, if yes then prevent normal check-in
      prisma.SpecialAttendance.findFirst({
        where: {
          userId,
          checkInTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
          checkOutTime: null, // user has checked in for special duty but not checked out yet, so prevent normal check-in
        },
      }),
    ]);

    if (existingAttendance) {
      return error(res, 400, "You have already checked in today");
    }
    if (existingSpecialAttendance) {
      return error(
        res,
        400,
        "You have already checked in for special duty, checkout first",
      );
    }

    Promise.all([
      checkInImage
        ? uploadFile(
            checkInImage.buffer,
            checkInImage.originalname,
            checkInImage.mimetype,
          )
        : null,
      prisma.user.findUnique({
        where: { id: userId },
      }),
    ]).then(async ([checkInImageKey, user]) => {
      if (!user || !checkInImageKey) {
        return error(res, 400, "Invalid user or check-in image");
      }

      const isValidLocation = verifyLocation(lat, lng, user.workLocation);
      if (!isValidLocation) {
        return error(
          res,
          400,
          "You are not within the allowed check-in location",
        );
      }

      const status = !isTodayWeekOff(user.weekendOff)
        ? getAttendanceStatus(user.shift)
        : "OVERTIME";

      // if user late send notification to admin, without blocking the check-in process
      if (status === "LATE") {
        prisma.user
          .findMany({
            where: { userType: "ADMIN" },
            select: { deviceId: true },
          })
          .then((admins) => {
            const tokens = admins
              .map((admin) => admin.deviceId)

            if (tokens.length > 0) {
              sendNotification(
                tokens,
                "Late Check-in",
                `${user.employeeName} has checked in late.`,
              );
            }
          })
          .catch(console.error);
      }

      // Create new attendance record
      const attendance = await prisma.attendance.create({
        data: {
          userId,
          date: new Date(),
          checkInTime: new Date(),
          checkInLocation: JSON.stringify({ lat, lng, address }),
          status: status,
          checkInPhoto: checkInImageKey,
        },
      });

      return success(res, 201, "Check-in successful", attendance);
    });
  } catch (err) {
    console.error("Check-in error:", err);
    return error(res, 500, "Internal server error", err);
  }
};

export const checkOut = async (req, res) => {
  try {
    const userId = req.user.userId;
    const checkOutImage = req.file;
    const { lat, lng, address } = req.body;

    if (!checkOutImage) {
      return error(res, 400, "Check-out image is required");
    }

    if (!lat || !lng) {
      return error(res, 400, "Check-out location is required");
    }

    // Find any unchecked-out attendance record for the user (handles multi-day shifts)
    Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
      }),
      prisma.attendance.findFirst({
        where: {
          userId,
          checkOutTime: null, // Must not have checked out yet
        },
        orderBy: {
          checkInTime: "desc", // Get the most recent unchecked-out record
        },
      }),
    ]).then(async ([user, existingAttendance]) => {
      if (!existingAttendance || !user) {
        return error(res, 400, "You have not checked in yet");
      }

      // This prevents checking out from old uncompleted shifts
      const checkInTime = new Date(existingAttendance.checkInTime);
      const now = new Date();
      const timeDifferenceMinutes = (now - checkInTime) / (1000 * 60);

      // Check if checkout date is different from check-in date
      const checkInDate = new Date(checkInTime).toDateString();
      const checkOutDate = new Date(now).toDateString();
      const isDateChanged = checkInDate !== checkOutDate;

      // user shift is in format "9:00 AM - 5:00 PM", we need to extract end time and convert to minutes
      const maxAllowedMinutes = isDateChanged
        ? getUserShiftTimeInMinutes(user.shift) + 60
        : getUserShiftTimeInMinutes(user.shift); // allow 1 hour buffer if date changed
      if (timeDifferenceMinutes > maxAllowedMinutes) {
        return error(
          res,
          400,
          "Cannot checkout from a check-in that was more than 24 hours ago",
        );
      }

      Promise.all([
        checkOutImage
          ? uploadFile(
              checkOutImage.buffer,
              checkOutImage.originalname,
              checkOutImage.mimetype,
            )
          : null,
        verifyLocation(lat, lng, user.workLocation),
        prisma.leaveEmployee.findFirst({
          where: {
            employeeId: userId,
            leave: {
              AND: [
                { startDate: { lte: getEndOfDay() } },
                { endDate: { gte: getStartOfDay() } },
              ],
            },
          },
          include: {
            leave: true,
          },
        }),
      ]).then(async ([checkOutImageKey, isValidLocation, isHoliday]) => {
        if (!checkOutImageKey) {
          return error(res, 400, "Invalid check-out image");
        }

        // calculate overtime if checkout done
        let overTime = 0;
        if (existingAttendance.checkInTime) {
          overTime = extraTime(
            existingAttendance.checkInTime,
            new Date(),
            user.shift,
            isHoliday ? true : false,
            user.weekendOff,
          );
        }

        // update record with check-out details
        const updatedAttendance = await prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: {
            checkOutTime: new Date(),
            checkOutLocation: JSON.stringify({ lat, lng, address }),
            checkOutPhoto: checkOutImageKey,
            extraTime: overTime,
            checkoutOutside: !isValidLocation,
            status:
              isHoliday || isTodayWeekOff(user.weekendOff)
                ? "OVERTIME"
                : "PRESENT",
          },
        });

        return success(res, 200, "Check-out successful", updatedAttendance);
      });
    });

    console.log("end");
  } catch (err) {
    console.error("Check-out error:", err);
    return error(res, 500, "Internal server error");
  }
};

export const createAttendance = async (req, res) => {
  // This endpoint can be used by admin to create attendance record for a user (for example in case of manual entry or correction)
  try {
    const { userId, date, checkInTime, checkOutTime, status } = req.body;

    const checkInDateTime = new Date(checkInTime);
    const checkOutDateTime = new Date(checkOutTime);

    // validate user exists
    const employee = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true },
    });
    if (!employee) {
      return error(res, 400, "Invalid userId");
    }

    // validate user is not trying to create attendance for future date
    const today = new Date();
    const attendanceDate = new Date(date);
    if (attendanceDate > today) {
      return error(res, 400, "Cannot create attendance for future date");
    }

    // validate check-out time is after check-in time
    if (checkOutDateTime <= checkInDateTime) {
      return error(res, 400, "Check-out time must be after check-in time");
    }

    // validate already existing attendance record for the user on the same date, if exists then prevent creation
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: parseInt(userId),
        date: new Date(date),
      },
    });
    if (existingAttendance) {
      return error(res, 400, "Attendance record already exists for this date");
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { shift: true, weekendOff: true },
    });

    const overTime = extraTime(
      checkInDateTime,
      checkOutDateTime,
      user.shift,
      false,
      user.weekendOff,
      status === "HALF_DAY",
      new Date(date),
    );

    const attendance = await prisma.attendance.create({
      data: {
        userId: parseInt(userId),
        date: new Date(date),
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        status,
        extraTime: overTime,
      },
    });
    return success(
      res,
      201,
      "Attendance record created successfully",
      attendance,
    );
  } catch (err) {
    console.error("Create attendance error:", err);
    return error(res, 500, "Internal server error");
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { date, checkInTime, checkOutTime, status } = req.body;

    let overTime = 0;
    if (checkInTime && checkOutTime) {
      const attendanceRecord = await prisma.attendance.findUnique({
        where: { id: parseInt(attendanceId) },
        include: {
          user: {
            select: {
              shift: true,
              weekendOff: true,
            },
          },
        },
      });
      if (!attendanceRecord) {
        return error(res, 404, "Attendance record not found");
      }

      overTime = extraTime(
        new Date(checkInTime),
        new Date(checkOutTime),
        attendanceRecord.user.shift,
        status === "OVERTIME" ? true : false,
        attendanceRecord.user.weekendOff,
        status === "HALF_DAY",
      );
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: parseInt(attendanceId) },
      data: {
        checkInTime: checkInTime ? new Date(checkInTime) : undefined,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
        date: date ? new Date(date) : undefined,
        extraTime: overTime,
        status,
      },
    });
    return success(
      res,
      200,
      "Attendance updated successfully",
      updatedAttendance,
    );
  } catch (err) {
    if (err.code === "P2025") {
      return error(res, 404, "Attendance record not found");
    }
    console.error("Update attendance error:", err);
    return error(res, 500, "Internal server error");
  }
};

export const specialDutyCheckIn = async (req, res) => {
  try {
    const userId = req.user.userId;
    const checkInImage = req.file;
    const { lat, lng, address } = req.body;
    const today = new Date();
    const startOfDay = getStartOfDay(today);
    const endOfDay = getEndOfDay(today);

    if (!checkInImage) {
      return error(res, 400, "Check-in image is required");
    }

    if (!lat || !lng) {
      return error(res, 400, "Check-in location is required");
    }

    const [existingAttendance, existingSpecialAttendance] = await Promise.all([
      // Check if user has already checked in today
      prisma.attendance.findFirst({
        where: {
          userId,
          checkInTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
          checkOutTime: null, // user has checked in for special duty but not checked out yet, so prevent normal check-in
        },
      }),
      // check if user has already checked in for special duty today, if yes then prevent normal check-in
      prisma.SpecialAttendance.findFirst({
        where: {
          userId,
          checkInTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
    ]);

    if (existingSpecialAttendance) {
      return error(res, 400, "You have already checked in for special duty");
    }
    if (existingAttendance) {
      return error(
        res,
        400,
        "You have already checked in normal today, checkout first for Special Duty",
      );
    }

    Promise.all([
      checkInImage
        ? uploadFile(
            checkInImage.buffer,
            checkInImage.originalname,
            checkInImage.mimetype,
          )
        : null,
      prisma.user.findUnique({
        where: { id: userId },
      }),
    ]).then(async ([checkInImageKey, user]) => {
      if (!user || !checkInImageKey) {
        return error(res, 400, "Invalid user or check-in image");
      }

      // Create new attendance record
      const attendance = await prisma.SpecialAttendance.create({
        data: {
          userId,
          date: new Date(),
          checkInTime: new Date(),
          checkInLocation: JSON.stringify({ lat, lng, address }),
          checkInPhoto: checkInImageKey,
        },
      });

      return success(res, 201, "Special Duty Check-in successful", attendance);
    });
  } catch (err) {
    console.error("Check-in error:", err);
    return error(res, 500, "Internal server error");
  }
};

export const specialDutyCheckOut = async (req, res) => {
  try {
    const userId = req.user.userId;
    const checkOutImage = req.file;
    const { lat, lng, address } = req.body;

    if (!checkOutImage) {
      return error(res, 400, "Check-out image is required");
    }

    if (!lat || !lng) {
      return error(res, 400, "Check-out location is required");
    }

    // Find any unchecked-out attendance record for the user (handles multi-day shifts)
    Promise.all([
      await prisma.user.findUnique({
        where: { id: userId },
      }),
      await prisma.SpecialAttendance.findFirst({
        where: {
          userId,
          checkOutTime: null, // Must not have checked out yet
        },
        orderBy: {
          checkInTime: "desc", // Get the most recent unchecked-out record
        },
      }),
    ]).then(async ([user, existingAttendance]) => {
      if (!existingAttendance || !user) {
        return error(res, 400, "You have not checked in yet");
      }

      // This prevents checking out from old uncompleted shifts
      const checkInTime = new Date(existingAttendance.checkInTime);
      const now = new Date();
      const timeDifferenceMinutes = (now - checkInTime) / (1000 * 60);

      // Check if checkout date is more than 24 hours from check-in date
      const maxAllowedMinutes = 24 * 60; // 24 hours
      if (timeDifferenceMinutes > maxAllowedMinutes) {
        return error(
          res,
          400,
          "Cannot checkout from a check-in that was more than 24 hours ago",
        );
      }

      Promise.all([
        checkOutImage
          ? await uploadFile(
              checkOutImage.buffer,
              checkOutImage.originalname,
              checkOutImage.mimetype,
            )
          : null,
      ]).then(async ([checkOutImageKey]) => {
        if (!checkOutImageKey) {
          return error(res, 400, "Invalid check-out image");
        }

        // calculate work hours if checkout done
        // let workHours = 0;
        // if (existingAttendance.checkInTime) {
        //   const checkInHour = new Date(
        //     existingAttendance.checkInTime,
        //   ).getUTCHours();
        //   const checkInMinutes = new Date(
        //     existingAttendance.checkInTime,
        //   ).getUTCMinutes();
        //   const checkOutHour = new Date().getUTCHours();
        //   const checkOutMinutes = new Date().getUTCMinutes();
        //   // 8:30 format
        //   workHours = `${checkOutHour - checkInHour}:${Math.abs(checkOutMinutes - checkInMinutes)}`;
        // }

        const workHours = calculateWorkHours(
          existingAttendance.checkInTime,
          new Date(),
        )

        // update record with check-out details
        const updatedAttendance = await prisma.SpecialAttendance.update({
          where: { id: existingAttendance.id },
          data: {
            checkOutTime: new Date(),
            checkOutLocation: JSON.stringify({ lat, lng, address }),
            checkOutPhoto: checkOutImageKey,
            workHours,
          },
        });

        return success(res, 200, "Check-out successful", updatedAttendance);
      });
    });
  } catch (err) {
    console.error("Check-out error:", err);
    return error(res, 500, "Internal server error");
  }
};

export const updateSpecialAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { date, workHours, checkInTime, checkOutTime } = req.body;
    const updatedAttendance = await prisma.SpecialAttendance.update({
      where: { id: parseInt(attendanceId) },
      data: {
        checkInTime: checkInTime ? new Date(checkInTime) : undefined,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
        date: date ? new Date(date) : undefined,
        workHours,
      },
    });
    return success(
      res,
      200,
      "Special Duty Attendance updated successfully",
      updatedAttendance,
    );
  } catch (err) {
    if (err.code === "P2025") {
      return error(res, 404, "Attendance record not found");
    }
    console.error("Update attendance error:", err);
    return error(res, 500, "Internal server error");
  }
};

export const getAttendanceCalendar = async (req, res) => {
  try {
    const { userId, month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Fetch records in parallel
    const [
      attendanceRecords,
      specialAttendanceRecords,
      user,
      holidays,
      oldestAttendance,
    ] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          userId: parseInt(userId),
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          date: true,
          status: true,
        },
        orderBy: { date: "asc" },
      }),
      prisma.SpecialAttendance.findMany({
        where: {
          userId: parseInt(userId),
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          date: true,
        },
        orderBy: { date: "asc" },
      }),
      prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { weekendOff: true },
      }),
      prisma.leaveEmployee.findMany({
        where: {
          employeeId: parseInt(userId),
          leave: {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
        },
        include: {
          leave: true,
        },
      }),
      prisma.attendance.findFirst({
        where: {
          userId: parseInt(userId),
        },
        orderBy: {
          date: "asc",
        },
        select: {
          date: true,
        },
      }),
    ]);

    // Create a Set of attendance dates for O(1) lookup
    const attendanceDateSet = new Set(
      attendanceRecords.map((record) => record.date.toDateString()),
    );

    // Create a Map for quick lookups of special records
    const specialRecordMap = new Map(
      specialAttendanceRecords.map((record) => [
        record.date.toDateString(),
        record,
      ]),
    );

    // Create a Map of holiday dates -> leaveId
    const holidayDateMap = new Map();
    holidays.forEach((holiday) => {
      let currentDate = new Date(holiday.leave.startDate);
      const endHolidayDate = new Date(holiday.leave.endDate);
      while (currentDate <= endHolidayDate) {
        holidayDateMap.set(currentDate.toDateString(), holiday.leave.id);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Merge records with holidays and weekends
    const mergedRecords = attendanceRecords.map((record) => {
      const specialRecord = specialRecordMap.get(record.date.toDateString());
      if (specialRecord) {
        return {
          id: record.id,
          specialId: specialRecord.id,
          date: record.date,
          status: "PRESENT_SPECIAL",
        };
      }
      return record;
    });

    // Add special attendance records that don't have a corresponding regular attendance record
    const specialOnlyRecords = specialAttendanceRecords
      .filter((special) => !attendanceDateSet.has(special.date.toDateString()))
      .map((special) => ({
        date: special.date,
        specialId: special.id,
        status: "SPECIAL",
      }));

    const recordsMap = new Map([
      ...mergedRecords.map((r) => [r.date.toDateString(), r]),
      ...specialOnlyRecords.map((r) => [r.date.toDateString(), r]),
    ]);

    // Generate all dates for the month and check for missing dates
    const allDatesInMonth = [];
    let currentDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oldestAttendanceDate = oldestAttendance
      ? new Date(oldestAttendance.date)
      : null;
    if (oldestAttendanceDate) {
      oldestAttendanceDate.setHours(0, 0, 0, 0);
    }

    while (currentDate <= endDate) {
      const dateString = currentDate.toDateString();

      if (!recordsMap.has(dateString)) {
        // Check if it's a holiday
        if (holidayDateMap.has(dateString)) {
          allDatesInMonth.push({
            date: formatDateOnly(currentDate),
            status: "HOLIDAY",
            holidayId: holidayDateMap.get(dateString),
          });
        }
        // Mark as ABSENT only for dates:
        // 1. Before or on today
        // 2. On or after the oldest attendance date
        else if (
          currentDate <= today &&
          (!oldestAttendanceDate || currentDate >= oldestAttendanceDate)
        ) {
          // check if it's a weekend off for the user, if yes then mark as WEEKEND_OFF
          if (isTodayWeekOff(user.weekendOff, currentDate.getDay())) {
            allDatesInMonth.push({
              date: formatDateOnly(currentDate),
              status: "WEEKOFF",
            });
          } else {
            allDatesInMonth.push({
              date: formatDateOnly(currentDate),
              status: "ABSENT",
            });
          }
        }
      }
      // For other dates, don't add anything (skip)
      else {
        allDatesInMonth.push({
          ...recordsMap.get(dateString),
          date: formatDateOnly(new Date(recordsMap.get(dateString).date)),
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return success(res, 200, "Attendance calendar retrieved successfully", {
      attendance: allDatesInMonth,
      pagination: {
        month,
        year,
      },
    });
  } catch (err) {
    if (err.code === "P2025") {
      return error(res, 404, "Attendance record not found");
    }
    console.error("Get attendance calendar error:", err);
    return error(res, 500, "Internal server error");
  }
};

export const getAttendanceById = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const attendance = await prisma.attendance.findUnique({
      where: { id: parseInt(attendanceId) },
      include: {
        user: {
          select: {
            employeeName: true,
            employeeId: true,
          },
        },
      },
    });
    if (!attendance) {
      return error(res, 404, "Attendance record not found");
    }

    // generate presigned URLs for check-in and check-out photos
    const photoKeys = [
      attendance.checkInPhoto,
      attendance.checkOutPhoto,
    ].filter(Boolean);

    const presignedUrlsMap = await batchPresignUrls(photoKeys);
    const photos = Object.fromEntries(presignedUrlsMap);

    return success(res, 200, "Attendance record retrieved successfully", {
      ...attendance,
      photos,
    });
  } catch (err) {
    console.error("Get attendance by ID error:", err);
    return error(res, 500, "Internal server error");
  }
};

export const getSpecialAttendanceById = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const attendance = await prisma.SpecialAttendance.findUnique({
      where: { id: parseInt(attendanceId) },
    });
    if (!attendance) {
      return error(res, 404, "Special Attendance record not found");
    }
    const photoKeys = [
      attendance.checkInPhoto,
      attendance.checkOutPhoto,
    ].filter(Boolean);

    const presignedUrlsMap = await batchPresignUrls(photoKeys);
    const photos = Object.fromEntries(presignedUrlsMap);

    return success(
      res,
      200,
      "Special Attendance record retrieved successfully",
      {
        ...attendance,
        photos,
      },
    );
  } catch (err) {
    console.error("Get special attendance by ID error:", err);
    return error(res, 500, "Internal server error");
  }
};

export const deleteAttendanceInBulk = async (req, res) => {
  try {
    const { attendanceIds } = req.body;
    if (!Array.isArray(attendanceIds) || attendanceIds.length === 0) {
      return error(res, 400, "attendanceIds must be a non-empty array");
    }
    await prisma.attendance.deleteMany({
      where: {
        id: {
          in: attendanceIds.map((id) => parseInt(id)),
        },
      },
    });
    return success(res, 200, "Attendance records deleted successfully");
  } catch (err) {
    if (err.code === "P2025") {
      return error(res, 404, "One or more attendance records not found");
    }
    console.error("Delete attendance in bulk error:", err);
    return error(res, 500, "Internal server error");
  }
};

export const deleteSpecialAttendanceInBulk = async (req, res) => {
  try {
    const { attendanceIds } = req.body;
    if (!Array.isArray(attendanceIds) || attendanceIds.length === 0) {
      return error(res, 400, "attendanceIds must be a non-empty array");
    }
    await prisma.SpecialAttendance.deleteMany({
      where: {
        id: {
          in: attendanceIds.map((id) => parseInt(id)),
        },
      },
    });
    return success(res, 200, "Special Attendance records deleted successfully");
  } catch (err) {
    if (err.code === "P2025") {
      return error(
        res,
        404,
        "One or more special attendance records not found",
      );
    }
    console.error("Delete special attendance in bulk error:", err);
    return error(res, 500, "Internal server error");
  }
};
