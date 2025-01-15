"use client"; // Ensures this component only renders on the client side

import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FullCalendarComponent = () => {
  const [weekendsVisible, setWeekendsVisible] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [currentEvents, setCurrentEvents] = useState([]);

  // Form states
  const [eventType, setEventType] = useState("Meeting");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [color, setColor] = useState("#0000ff"); // Default color
  const [label, setLabel] = useState("");
  const [participants, setParticipants] = useState("");
  const [recurrence, setRecurrence] = useState("none"); // Recurrence state
  const [reminder, setReminder] = useState(""); // Reminder state (minutes before)

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const [meetingsResponse, tasksResponse] = await Promise.all([
        fetch("http://localhost:8000/meetings/"),
        fetch("http://localhost:8000/tasks/"),
      ]);

      const meetings = await meetingsResponse.json();
      const tasks = await tasksResponse.json();

      // Transform meetings and tasks to FullCalendar's event format
      const events = [
        ...meetings.map((m) => ({
          id: `meeting-${m.id}`,
          title: m.title,
          start: `${m.date}T${m.start_time}`,
          end: `${m.date}T${m.end_time}`,
          backgroundColor: m.color || "#3788d8",
          extendedProps: {
            description: m.description,
            type: "Meeting",
            participants: m.participants,
            categories: m.categories,
          },
        })),
        ...tasks.map((t) => ({
          id: `task-${t.id}`,
          title: t.title,
          start: t.due_date,
          backgroundColor: t.color || "#ff9f89",
          extendedProps: {
            description: t.description,
            type: "Task",
            participants: t.participants,
            categories: t.categories,
          },
        })),
      ];

      setCurrentEvents(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      alert("Failed to fetch events. Please try again.");
    }
  };

  const handleWeekendsToggle = () => {
    setWeekendsVisible(!weekendsVisible);
  };

  const handleDateSelect = (selectInfo) => {
    setSelectedInfo(selectInfo);
    setDate(selectInfo.startStr.split("T")[0]); // Autofill date for "Meeting"
    setIsDialogOpen(true);
  };

  const handleEventCreate = async () => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    try {
      const eventData = {
        title,
        description,
        color,
        participant_ids: participants
          .split(",")
          .map((id) => parseInt(id.trim(), 10)), // Convert participant IDs to integers
        category_ids: label.split(",").map((id) => parseInt(id.trim(), 10)), // Convert category IDs to integers
      };

      if (eventType === "Meeting") {
        // Additional data for meetings
        eventData.date = date;
        eventData.start_time = startTime;
        eventData.end_time = endTime;
      } else {
        // Additional data for tasks
        eventData.due_date = dueDate;
      }

      if (recurrence !== "none") {
        eventData.recurrence = recurrence;
      }
      
      if (reminder) {
        eventData.reminder = parseInt(reminder, 10); 
      }
      

      const endpoint = eventType === "Meeting" ? "meetings" : "tasks";
      const response = await fetch(`http://localhost:8000/${endpoint}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${eventType} created successfully!`);
        resetForm();
        // Optionally, reload events from backend
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    }
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
    setRecurrence("none");
    setReminder("");
    setIsDialogOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 rounded-md">
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
          events={currentEvents}
          select={handleDateSelect}
        />
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Add New {eventType === "Meeting" ? "Meeting" : "Task"}
            </DialogTitle>
            <DialogDescription>
              Please fill in the event details.
            </DialogDescription>
          </DialogHeader>

          <Select
            onValueChange={(value) => setEventType(value)}
            value={eventType}
            className="mb-4"
          >
            <SelectTrigger className="w-full">Type: {eventType}</SelectTrigger>
            <SelectContent>
              <SelectItem value="Meeting">Meeting</SelectItem>
              <SelectItem value="Task">Task</SelectItem>
            </SelectContent>
          </Select>

          <div className="mb-4">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {eventType === "Meeting" ? (
            <>
              <div className="mb-4">
                <Label htmlFor="date">Date</Label>
                <Input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    type="time"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    type="time"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="mb-4">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          )}

          <div className="mb-4">
            <Label htmlFor="recurrence">Recurrence</Label>
            <Select
              onValueChange={(value) => setRecurrence(value)}
              value={recurrence}
              className="w-full"
            >
              <SelectTrigger>Recurrence: {recurrence}</SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <Label htmlFor="reminder">Reminder (minutes before)</Label>
            <Input
              type="number"
              id="reminder"
              placeholder="Enter minutes"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="color">Color (optional)</Label>
            <div className="flex gap-4">
              {[
                "#FF6F61", // Bright Pastel Coral
                "#FFA500", // Bright Pastel Orange
                "#FFD700", // Bright Pastel Gold
                "#9ACD32", // Bright Pastel Green
                "#FF69B4", // Bright Pastel Hot Pink
                "#40E0D0", // Bright Pastel Turquoise
                "#ADFF2F", // Bright Pastel Lime Green
                "#1E90FF", // Bright Pastel Dodger Blue
              ].map((clr) => (
                <label key={clr} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="color"
                    value={clr}
                    checked={color === clr}
                    onChange={(e) => setColor(e.target.value)}
                    className="hidden"
                  />
                  <div
                    className={`w-8 h-8 rounded-full border-2 cursor-pointer`}
                    style={{
                      backgroundColor: clr,
                      borderColor: color === clr ? "black" : "transparent",
                    }}
                  ></div>
                </label>
              ))}
            </div>
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
