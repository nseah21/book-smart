"use client"; // Ensures this component only renders on the client side

import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
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
import dayjs from "dayjs";

const FullCalendarComponent = () => {
  const [weekendsVisible, setWeekendsVisible] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);

  // Form states
  const [eventType, setEventType] = useState("Meeting");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [participants, setParticipants] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [reminder, setReminder] = useState("");
  const [color, setColor] = useState("#0000ff");

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEventClick = (clickInfo) => {
    const { title, extendedProps, start, end } = clickInfo.event;

    setEventDetails({
      title,
      description: extendedProps.description || "No description",
      start: start.toISOString(),
      end: end ? end.toISOString() : "N/A",
      participants: extendedProps.participants || [],
      categories: extendedProps.categories || [],
    });

    setIsEventDetailsOpen(true);
  };

  const handleDateSelect = (selectInfo) => {
    setSelectedInfo(selectInfo);
    setDate(selectInfo.startStr.split("T")[0]); // Autofill the date in the form
    setIsDialogOpen(true); // Open the dialog
  };

  const fetchEvents = async () => {
    try {
      const [meetingsResponse, tasksResponse, recurrencesResponse] =
        await Promise.all([
          fetch("http://localhost:8000/meetings/", { method: "GET" }),
          fetch("http://localhost:8000/tasks/", { method: "GET" }),
          fetch("http://localhost:8000/recurrences/", { method: "GET" }),
        ]);

      const meetings = await meetingsResponse.json();
      const tasks = await tasksResponse.json();
      const recurrences = await recurrencesResponse.json();

      const recurrenceEvents = generateRecurrenceEvents(
        recurrences.recurring_meetings,
        meetings // Pass existing meetings to prevent duplication
      );

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
          },
        })),
        ...recurrenceEvents,
      ];

      setCurrentEvents(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      alert("Failed to fetch events. Please try again.");
    }
  };

  const generateRecurrenceEvents = (recurringMeetings, existingMeetings) => {
    const events = [];
    const maxDate = dayjs().add(2, "month"); // Cap at 2 months

    // Extract existing meeting dates to avoid duplication
    const existingMeetingDates = new Set(
      existingMeetings.map(
        (meeting) => `${meeting.date}T${meeting.start_time}` // Match both date and time
      )
    );

    recurringMeetings.forEach((recurrence) => {
      const startDate = dayjs(recurrence.date);
      const endDate = recurrence.end_date
        ? dayjs(recurrence.end_date)
        : maxDate;

      let currentDate = startDate;

      while (currentDate.isBefore(maxDate) && currentDate.isBefore(endDate)) {
        const startDateTime = `${currentDate.format("YYYY-MM-DD")}T${
          recurrence.start_time
        }`;

        // Skip the first instance if it already exists in the meetings
        if (!existingMeetingDates.has(startDateTime)) {
          events.push({
            id: `recurrence-${recurrence.recurrence_id}-${currentDate.format(
              "YYYY-MM-DD"
            )}`,
            title: recurrence.title,
            start: startDateTime,
            end: `${currentDate.format("YYYY-MM-DD")}T${recurrence.end_time}`,
            backgroundColor: "#00aaff",
            extendedProps: {
              description: recurrence.description,
              type: "Recurring Meeting",
            },
          });
        }

        // Increment by the recurrence interval
        switch (recurrence.frequency) {
          case "daily":
            currentDate = currentDate.add(recurrence.interval, "day");
            break;
          case "weekly":
            currentDate = currentDate.add(recurrence.interval, "week");
            break;
          case "monthly":
            currentDate = currentDate.add(recurrence.interval, "month");
            break;
          default:
            break;
        }
      }
    });

    return events;
  };

  const lookupParticipantIds = async (emails) => {
    try {
      // Fetch all participants from the backend
      const response = await fetch("http://localhost:8000/participants/");
      if (!response.ok) {
        throw new Error("Failed to fetch participants");
      }

      const participants = await response.json();

      // Split the emails string into an array and trim whitespace
      const emailList = emails
        .split(",")
        .map((email) => email.trim().toLowerCase());

      // Find matching participants by email
      const participantIds = emailList
        .map((email) => {
          const participant = participants.find(
            (p) => p.email.toLowerCase() === email
          );
          return participant ? participant.id : null; // Return null if not found
        })
        .filter((id) => id !== null); // Exclude null values

      // Check for any missing participants
      const missingEmails = emailList.filter(
        (email) => !participants.some((p) => p.email.toLowerCase() === email)
      );

      if (missingEmails.length > 0) {
        console.warn(
          `Warning: Some emails were not found: ${missingEmails.join(", ")}`
        );
      }

      return participantIds;
    } catch (error) {
      console.error("Error looking up participant IDs:", error);
      throw error; // Rethrow to handle in the calling function
    }
  };

  const handleEventCreate = async () => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    try {
      // Ensure the date and time fields are correctly formatted
      const formattedDate = dayjs(date).isValid()
        ? dayjs(date).format("YYYY-MM-DD")
        : null;
      const formattedStartTime = dayjs(startTime, "HH:mm").isValid()
        ? dayjs(startTime, "HH:mm").format("HH:mm:ss")
        : null;
      const formattedEndTime = dayjs(endTime, "HH:mm").isValid()
        ? dayjs(endTime, "HH:mm").format("HH:mm:ss")
        : null;

      if (!formattedDate || !formattedStartTime || !formattedEndTime) {
        alert("Invalid date or time provided. Please check your input.");
        return;
      }

      // Construct the payload
      const eventData = {
        title,
        description,
        date: formattedDate,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        frequency: recurrence !== "none" ? recurrence : null,
        interval: 1, // Default interval
      };

      console.log("Request Payload:", eventData);

      const response = await fetch("http://localhost:8000/recurrences/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        alert("Recurring meeting created successfully!");
        resetForm();
        fetchEvents(); // Refresh events
      } else {
        const errorData = await response.json();
        console.error("Error Response:", errorData);
        alert("Failed to create recurring meeting. Please try again.");
      }
    } catch (error) {
      console.error("Error creating recurring meeting:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setDueDate("");
    setParticipants("");
    setRecurrence("none");
    setReminder("");
    setColor("#0000ff");
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
          select={handleDateSelect}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={weekendsVisible}
          events={currentEvents}
          eventClick={handleEventClick}
        />
      </div>

      {/* Event Details Modal */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="max-w-lg p-6 bg-white rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-800 mb-2">
              {eventDetails?.title}
            </DialogTitle>
            <DialogDescription>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Description
                  </p>
                  <p className="text-base text-gray-700">
                    {eventDetails?.description}
                  </p>
                </div>
                <div>
                  <p className="text-base text-gray-700">
                    {eventDetails?.start}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">End</p>
                  <p className="text-base text-gray-700">{eventDetails?.end}</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              variant="secondary"
              onClick={() => setIsEventDetailsOpen(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded-md"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Label htmlFor="participants">
              Participants (comma-separated emails)
            </Label>
            <Input
              id="participants"
              placeholder="Enter participant emails"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
            />
          </div>

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
                "#FF6F61",
                "#FFA500",
                "#FFD700",
                "#9ACD32",
                "#FF69B4",
                "#40E0D0",
                "#ADFF2F",
                "#1E90FF",
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
            <Button variant="secondary" onClick={resetForm}>
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
