import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 - 17

const Schedule = () => {
  const { schedule } = useAppStore();
  const [weekOffset, setWeekOffset] = useState(0);

  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" description="Your weekly timetable">
        <Button variant="outline" size="icon" onClick={() => setWeekOffset(weekOffset - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="text-sm font-medium px-2">Week {weekOffset === 0 ? "current" : weekOffset > 0 ? `+${weekOffset}` : weekOffset}</span>
        <Button variant="outline" size="icon" onClick={() => setWeekOffset(weekOffset + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[800px] grid" style={{ gridTemplateColumns: "60px repeat(5, 1fr)" }}>
            <div className="border-b border-r p-2 bg-muted/30" />
            {days.map((d) => (
              <div key={d} className="border-b border-r p-3 bg-muted/30 text-center font-semibold text-sm">{d}</div>
            ))}
            {hours.map((h) => (
              <>
                <div key={`h-${h}`} className="border-b border-r p-2 text-xs text-muted-foreground text-right pr-3">{h}:00</div>
                {days.map((_, dayIdx) => {
                  const event = schedule.find((e) => e.day === dayIdx + 1 && e.startHour === h);
                  return (
                    <div key={`${h}-${dayIdx}`} className="border-b border-r p-1 min-h-[60px] relative">
                      {event && (
                        <div
                          className="absolute inset-1 rounded-lg p-2 text-white text-xs shadow-md hover:shadow-lg transition cursor-pointer"
                          style={{
                            background: `linear-gradient(135deg, hsl(${event.color}), hsl(${event.color} / 0.8))`,
                            height: `${(event.endHour - event.startHour) * 60 - 8}px`,
                          }}
                        >
                          <div className="font-bold">{event.title}</div>
                          <div className="opacity-90 text-[10px]">{event.room}</div>
                          <div className="opacity-80 text-[10px] mt-1">{event.startHour}:00 - {event.endHour}:00</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedule;
