import { formatOverTime } from "../../../../shared/utils/dashboard.utils"
import {
  Calendar,
  Clock,
} from "lucide-react";

const StatsCards = ({totalExtraTime,lateCheckIns,isUndertime}) => {
  
  return (
    <div className="grid grid-cols-2 gap-2 mb-8">
        {/* Total Overtime Card */}
        <div className="rounded-2xl p-3 flex items-center gap-2 bg-surface border border-primary/10 shadow-xs">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-background">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">
              {isUndertime ? "Total UnderTime" : "Total OverTime"}
            </p>
            <p className="text-base font-medium text-text-primary">
              {formatOverTime(totalExtraTime)}
            </p>
          </div>
        </div>

        {/* Late Check In Card */}
        <div className="rounded-2xl p-3 flex items-center gap-2 border border-primary/10 bg-surface shadow-xs">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-background">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Late Check In</p>
            <p className="text-base font-medium text-text-primary">
              {lateCheckIns}
            </p>
          </div>
        </div>
      </div>

  )
}

export default StatsCards