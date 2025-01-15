"use client"; // Ensures this component only renders on the client side

import React, { useState } from 'react';
import { formatDate } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { INITIAL_EVENTS, createEventId } from './event-utils';

const FullCalendarComponent = () => {
  const [weekendsVisible, setWeekendsVisible] = useState(true);
  const [currentEvents, setCurrentEvents] = useState([]);

  const handleWeekendsToggle = () => {
    setWeekendsVisible(!weekendsVisible);
  };

  const handleDateSelect = (selectInfo) => {
    let title = prompt('Please enter a new title for your event');
    let calendarApi = selectInfo.view.calendar;

    calendarApi.unselect(); // Clear selection after prompt

    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
      });
    }
  };

  const handleEventClick = (clickInfo) => {
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      clickInfo.event.remove();
    }
  };

  const handleEvents = (events) => {
    setCurrentEvents(events);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {renderSidebar(weekendsVisible, handleWeekendsToggle, currentEvents)}
      <div className="flex-grow p-6">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          initialView="dayGridMonth"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={weekendsVisible}
          initialEvents={INITIAL_EVENTS}
          select={handleDateSelect}
          eventContent={renderEventContent} // Custom render function for event content
          eventClick={handleEventClick}
          eventsSet={handleEvents} // Called after events are initialized/added/changed/removed
        />
      </div>
    </div>
  );
};

const renderSidebar = (weekendsVisible, handleWeekendsToggle, currentEvents) => {
  return (
    <div className="w-80 bg-white shadow-md border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Instructions</h2>
        <ul className="list-disc pl-5">
          <li className="my-4">Select dates and you will be prompted to create a new event</li>
          <li className="my-4">Drag, drop, and resize events</li>
          <li className="my-4">Click an event to delete it</li>
        </ul>
      </div>
      <div className="p-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={weekendsVisible}
            onChange={handleWeekendsToggle}
          />
          <span className="text-sm font-medium">Toggle weekends</span>
        </label>
      </div>
      <div className="p-6">
        <h2 className="text-lg font-semibold">All Events ({currentEvents.length})</h2>
        <ul className="list-disc pl-5">
          {currentEvents.map(renderSidebarEvent)}
        </ul>
      </div>
    </div>
  );
};

const renderEventContent = (eventInfo) => {
  return (
    <div>
      <b className="mr-1">{eventInfo.timeText}</b>
      <span className="italic">{eventInfo.event.title}</span>
    </div>
  );
};

const renderSidebarEvent = (event) => {
  return (
    <li key={event.id} className="my-4">
      <b className="text-gray-700">
        {formatDate(event.start, { year: 'numeric', month: 'short', day: 'numeric' })}
      </b>
      <span className="italic">{event.title}</span>
    </li>
  );
};

export default FullCalendarComponent;
