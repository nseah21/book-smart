import React, { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // Month view
import timeGridPlugin from '@fullcalendar/timegrid'; // Week/day view
import interactionPlugin from '@fullcalendar/interaction'; // Enables user interactions

const Calendar = ({ view }) => {
  const events = [
    {
      title: "Example Event",
      start: "2024-03-24T11:15:30.762Z",
      end: "2024-03-24T11:50:15.762Z",
    },
  ];

  const calendarRef = useRef(null);

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      if (["timeGridDay", "timeGridWeek", "dayGridMonth"].includes(view)) {
        calendarApi.changeView(view);
      }
    }
  }, [view]);

  return (
    <div id={view === "dayGridMonth" ? "month" : view === "timeGridWeek" ? "week" : "day"}>
      <FullCalendar
        ref={calendarRef}
        firstDay={1}
        slotLabelFormat={{
          hour: "numeric",
          hour12: true,
        }}
        slotMinTime={"10:00:00"} // 24-hour format, must be a string like "10:00:00"
        slotMaxTime={"19:00:00"} // Must be a valid time string
        headerToolbar={false}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialEvents={events}
        initialView={view}
      />
    </div>
  );
};

export default Calendar;
