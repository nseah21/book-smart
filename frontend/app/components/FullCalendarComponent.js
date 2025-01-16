"use client"; // Ensures this component only renders on the client side

import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { INITIAL_EVENTS, createEventId } from "./event-utils";
import dayjs from "dayjs";
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
  const fetchEvents = async () => {
    try {
      const currentUserEmail = localStorage.getItem("email");

      const [meetingsResponse, tasksResponse, recurrencesResponse] =
        await Promise.all([
          fetch("http://localhost:8000/meetings/", { method: "GET" }),
          fetch("http://localhost:8000/tasks/", { method: "GET" }),
          fetch("http://localhost:8000/recurrences/", { method: "GET" }),
        ]);

      const meetings = await meetingsResponse.json();
      const tasks = await tasksResponse.json();
      const recurrences = await recurrencesResponse.json();

      const events = [
        ...meetings
          .filter(
            (m) =>
              Array.isArray(m.participants) &&
              m.participants.some((p) => p.email === currentUserEmail)
          ) // Safeguard for participants in meetings
          .map((m) => ({
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
        ...tasks
          .filter(
            (t) =>
              Array.isArray(t.participants) &&
              t.participants.some((p) => p.email === currentUserEmail)
          ) // Safeguard for participants in tasks
          .map((t) => ({
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

      if (
        recurrences.recurring_meetings &&
        Array.isArray(recurrences.recurring_meetings)
      ) {
        recurrences.recurring_meetings
          .filter(
            (r) =>
              Array.isArray(r.participants) &&
              r.participants.some((p) => p.email === currentUserEmail)
          ) // Safeguard for participants in recurring meetings
          .forEach((item) => {
            const expandedMeetings = expandRecurringMeeting(item);
            events.push(...expandedMeetings);
          });
      }

      setCurrentEvents(events);
    } catch (error) {
      console.error("Error fetching events:", error.message);
      alert("Failed to fetch events. Please try again.");
    }
  };

  const expandRecurringMeeting = (recurrence) => {
    const {
      title,
      description,
      date,
      start_time,
      end_time,
      frequency,
      interval,
      end_date,
      color, // Include color from the recurrence data
      participants, // Include participants for filtering
    } = recurrence;

    const currentUserEmail = localStorage.getItem("email"); // Get the current user's email

    // Safeguard: Check if participants exist and include the current user
    if (
      !Array.isArray(participants) ||
      !participants.some((p) => p.email === currentUserEmail)
    ) {
      return []; // If the current user is not a participant, return an empty array
    }

    const events = [];
    const startDate = dayjs(date);
    const calculatedEndDate = end_date
      ? dayjs(end_date)
      : dayjs().add(1, "year"); // Default end date: one year from today

    let currentDate = startDate;

    // Generate recurring events
    while (
      currentDate.isBefore(calculatedEndDate) ||
      currentDate.isSame(calculatedEndDate)
    ) {
      events.push({
        id: `meeting-${recurrence.recurrence_id}-${currentDate.format(
          "YYYY-MM-DD"
        )}`,
        title,
        start: `${currentDate.format("YYYY-MM-DD")}T${start_time}`,
        end: `${currentDate.format("YYYY-MM-DD")}T${end_time}`,
        backgroundColor: color || "#3788d8", // Use color from DB, fallback to default
        extendedProps: {
          description,
          type: "Meeting",
          recurrence: frequency,
        },
      });

      // Increment the current date based on the recurrence frequency
      if (frequency === "daily") {
        currentDate = currentDate.add(interval, "day");
      } else if (frequency === "weekly") {
        currentDate = currentDate.add(interval, "week");
      } else if (frequency === "monthly") {
        currentDate = currentDate.add(interval, "month");
      } else if (frequency === "yearly") {
        currentDate = currentDate.add(interval, "year");
      }
    }

    return events;
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
      participants.push(localStorage.getItem("email"));

      // Convert participant emails to IDs
      const participantIds = await lookupParticipantIds(participants);

      // Ensure the current user is added as a participant
      if (!participantIds.includes(currentUserId)) {
        participantIds.push(currentUserId);
      }

      // Construct event data
      const eventData = {
        title,
        description,
        color,
        participant_ids: participantIds, // Include participants
        category_ids: [], // Optional: handle categories
        reminder: reminder ? parseInt(reminder, 10) : null,
      };

      if (eventType === "Meeting") {
        eventData.date = date;
        eventData.start_time = startTime;
        eventData.end_time = endTime;

        // Handle recurrence for meetings
        if (recurrence !== "none") {
          eventData.frequency = recurrence;
          eventData.interval = 1; // Adjust based on user input
          eventData.end_date = null;

          // Send the request to create a recurring meeting
          const recurrenceResponse = await fetch(
            "http://localhost:8000/recurrences/",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(eventData),
            }
          );

          if (recurrenceResponse.ok) {
            alert("Recurring meeting created successfully!");
            resetForm();
            fetchEvents(); // Refresh events
            return;
          } else {
            const errorData = await recurrenceResponse.json();
            console.error("Error:", errorData);
            alert("Failed to create recurring meeting. Please try again.");
            return;
          }
        }
      } else {
        // Handle tasks (non-recurring)
        eventData.due_date = dueDate;
      }

      // Send the request to create a non-recurring meeting or task
      const endpoint = eventType === "Meeting" ? "meetings" : "tasks";
      const response = await fetch(`http://localhost:8000/${endpoint}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        alert(`${eventType} created successfully!`);
        resetForm();
        fetchEvents(); // Refresh events
      } else {
        const errorData = await response.json();
        console.error("Error:", errorData);
        alert("Failed to create event. Please try again.");
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
          selectMirror={true}
          dayMaxEvents={true}
          weekends={weekendsVisible}
          events={currentEvents}
          eventClick={handleEventClick}
          select={handleDateSelect}
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
                  <p className="text-sm font-medium text-gray-500">Start</p>
                  <p className="text-base text-gray-700">
                    {eventDetails?.start
                      ? dayjs(eventDetails.start).format(
                          "dddd, MMMM D, YYYY h:mm A"
                        )
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">End</p>
                  <p className="text-base text-gray-700">
                    {eventDetails?.end
                      ? dayjs(eventDetails.end).format(
                          "dddd, MMMM D, YYYY h:mm A"
                        )
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Participants
                  </p>
                  <p className="text-base text-gray-700">
                    {eventDetails?.participants.length > 0
                      ? eventDetails.participants
                          .map((p) => `${p.name} (${p.email})`)
                          .join(", ")
                      : "None"}
                  </p>
                </div>
                {/* <div>
                  <p className="text-sm font-medium text-gray-500">
                    Categories
                  </p>
                  <p className="text-base text-gray-700">
                    {eventDetails?.categories.length > 0
                      ? eventDetails.categories.map((c) => c.name).join(", ")
                      : "None"}
                  </p>
                </div> */}
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

          {/* Event Type Selector */}
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

          {/* Title Field */}
          <div className="mb-4">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description Field */}
          <div className="mb-4">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Conditional Fields for Meeting or Task */}
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

          {/* Participants */}
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

          {/* Recurrence Section (Visible Only for Meetings) */}
          {eventType === "Meeting" && (
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
          )}

          {/* Reminder */}
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

          {/* Color Picker */}
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

          {/* Footer Buttons */}
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
