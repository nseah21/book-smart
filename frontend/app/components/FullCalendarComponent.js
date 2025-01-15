"use client"; // Ensures this component only renders on the client side

import React, { useState } from "react";
import { formatDate } from "@fullcalendar/core";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { INITIAL_EVENTS, createEventId } from "./event-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FullCalendarComponent = () => {
  const [weekendsVisible, setWeekendsVisible] = useState(true);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);

  // Form states
  const [eventType, setEventType] = useState("meeting");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [color, setColor] = useState("#0000ff"); // Default color
  const [label, setLabel] = useState("");
  const [participants, setParticipants] = useState("");

  const handleWeekendsToggle = () => {
    setWeekendsVisible(!weekendsVisible);
  };

  const handleDateSelect = (selectInfo) => {
    setSelectedInfo(selectInfo);
    setDate(selectInfo.startStr.split("T")[0]); // Autofill date for "Meeting"
    setIsDialogOpen(true);
  };

  const handleEventCreate = () => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    const calendarApi = selectedInfo.view.calendar;
    calendarApi.unselect(); // Clear selection

    const newEvent = {
      id: createEventId(),
      title,
      start: eventType === "meeting" ? `${date}T${startTime}` : dueDate,
      end: eventType === "meeting" ? `${date}T${endTime}` : null,
      allDay: false,
      extendedProps: {
        description,
        type: eventType,
        color,
        label,
        participants: participants.split(",").map((p) => p.trim()), // Split participants by commas
      },
      backgroundColor: color,
    };

    calendarApi.addEvent(newEvent);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setDueDate("");
    setColor("#0000ff");
    setLabel("");
    setParticipants("");
    setIsDialogOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-grow p-6">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          initialView="dayGridMonth"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={weekendsVisible}
          initialEvents={INITIAL_EVENTS}
          select={handleDateSelect}
        />
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {eventType === "meeting" ? "Meeting" : "Task"}</DialogTitle>
            <DialogDescription>Please fill in the event details.</DialogDescription>
          </DialogHeader>
          <Select onValueChange={(value) => setEventType(value)} value={eventType} className="mb-4">
            <SelectTrigger className="w-full">Type: {eventType}</SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="task">Task</SelectItem>
            </SelectContent>
          </Select>

          <div className="mb-4">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Enter title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="mb-4">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Enter description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {eventType === "meeting" ? (
            <>
              <div className="mb-4">
                <Label htmlFor="date">Date</Label>
                <Input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input type="time" id="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input type="time" id="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>
            </>
          ) : (
            <div className="mb-4">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input type="date" id="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          )}

          <div className="mb-4">
            <Label htmlFor="color">Color (optional)</Label>
            <Input type="color" id="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>

          <div className="mb-4">
            <Label htmlFor="label">Label (optional)</Label>
            <Input id="label" placeholder="Enter label" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <div className="mb-4">
            <Label htmlFor="participants">Participants (comma-separated)</Label>
            <Input
              id="participants"
              placeholder="Enter participants (e.g., Alice, Bob)"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEventCreate}>Create Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FullCalendarComponent;
