import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const API_BASE_URL = "https://internshipdevelopershubcorporationproject2-nexus-production.up.railway.app";

interface AvailabilitySlot { start: string; end: string; }
interface AvailabilityDay { date: string; slots: AvailabilitySlot[]; }

interface Meeting {
  _id: string;
  title: string;
  slot: { start: string; end: string };
  participants: any[];
  videoLink?: string;
}

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const [myAvailability, setMyAvailability] = useState<AvailabilityDay[]>([]);
  const [otherAvailability, setOtherAvailability] = useState<AvailabilityDay[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(new Date()));
  const [bookingTitle, setBookingTitle] = useState<string>("Introduction Call");
  const [bookingStart, setBookingStart] = useState<string>("");
  const [bookingEnd, setBookingEnd] = useState<string>("");

  const [availDate, setAvailDate] = useState<string>(toDateKey(new Date()));
  const [availStart, setAvailStart] = useState<string>("");
  const [availEnd, setAvailEnd] = useState<string>("");

  const token = useMemo(() => localStorage.getItem("token") || "", []);

  // Load all users
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load users"));
  }, [token]);

  // Load my availability and meetings
  useEffect(() => {
    if (!user) return;

    fetch(`${API_BASE_URL}/api/meetings/availability/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => Array.isArray(data) ? setMyAvailability(data) : setMyAvailability([]))
      .catch(() => setMyAvailability([]));

    fetch(`${API_BASE_URL}/api/meetings/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return setMeetings([]);
        const normalized = data.map((m: any) => ({
          _id: m._id,
          title: m.title || "Untitled",
          slot: { start: m.start, end: m.end },
          participants: m.participants || [],
          videoLink: m.videoLink || "",
        }));
        setMeetings(normalized);
      })
      .catch(() => setMeetings([]));
  }, [user, token]);

  // Load selected user's availability
  useEffect(() => {
    if (!selectedUserId) return;

    fetch(`${API_BASE_URL}/api/meetings/availability/${selectedUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((docs) => Array.isArray(docs) ? setOtherAvailability(docs) : setOtherAvailability([]))
      .catch(() => setOtherAvailability([]));
  }, [selectedUserId, token]);

  if (!user) return null;

  // Create Meeting
  const createBooking = async () => {
    if (!bookingStart || !bookingEnd || !selectedUserId)
      return toast.error("Pick a slot and user");

    try {
      const res = await fetch(`${API_BASE_URL}/api/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          participantId: selectedUserId,
          slot: { start: bookingStart, end: bookingEnd },
          title: bookingTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.msg || "Failed to book");

      setMeetings((prev) => [
        ...prev,
        {
          _id: data.meeting._id,
          title: data.meeting.title,
          slot: { start: data.meeting.start, end: data.meeting.end },
          participants: data.meeting.participants,
          videoLink: data.meeting.videoLink || "",
        },
      ]);

      toast.success("Meeting scheduled");
      setBookingStart("");
      setBookingEnd("");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  // Add Availability
  const addAvailability = async () => {
    if (!availDate || !availStart || !availEnd)
      return toast.error("Please select date, start & end time");

    try {
      const res = await fetch(`${API_BASE_URL}/api/meetings/availability/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: availDate,
          slots: [{ start: availStart, end: availEnd }],
        }),
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.msg || "Failed to save availability");

      setMyAvailability((prev) => {
        const existing = prev.find((d) => d.date === availDate);
        if (existing) {
          return prev.map((d) =>
            d.date === availDate
              ? { ...d, slots: [...d.slots, { start: availStart, end: availEnd }] }
              : d
          );
        }
        return [...prev, { date: availDate, slots: [{ start: availStart, end: availEnd }] }];
      });

      toast.success("Availability added");
      setAvailStart("");
      setAvailEnd("");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  // Compute common slots
  const todaysSlots = (() => {
    const myDay = myAvailability.find((d) => d.date === selectedDate)?.slots || [];
    const otherDay = otherAvailability.find((d) => d.date === selectedDate)?.slots || [];
    const bookedSlots = meetings
      .filter((m) => m.slot.start && m.slot.end)
      .map((m) => ({ start: new Date(m.slot.start), end: new Date(m.slot.end) }));

    const slots: { start: Date; end: Date; label: string }[] = [];

    myDay.forEach((ms) => {
      const myStart = new Date(`${selectedDate}T${ms.start}:00`);
      const myEnd = new Date(`${selectedDate}T${ms.end}:00`);
      otherDay.forEach((os) => {
        const otherStart = new Date(`${selectedDate}T${os.start}:00`);
        const otherEnd = new Date(`${selectedDate}T${os.end}:00`);
        const start = myStart > otherStart ? myStart : otherStart;
        const end = myEnd < otherEnd ? myEnd : otherEnd;
        if (start < end) {
          const overlap = bookedSlots.some(
            (b) => start < b.end && end > b.start
          );
          if (!overlap)
            slots.push({
              start,
              end,
              label: `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
            });
        }
      });
    });
    return slots;
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Set Availability */}
      <Card>
        <CardHeader><h2 className="text-lg font-medium text-gray-900">Set My Availability</h2></CardHeader>
        <CardBody>
          <div className="grid md:grid-cols-3 gap-4">
            <input type="date" className="border p-2 rounded-md" value={availDate} onChange={(e) => setAvailDate(e.target.value)} />
            <input type="time" className="border p-2 rounded-md" value={availStart} onChange={(e) => setAvailStart(e.target.value)} />
            <input type="time" className="border p-2 rounded-md" value={availEnd} onChange={(e) => setAvailEnd(e.target.value)} />
          </div>
          <Button className="mt-3" onClick={addAvailability}>Add Availability</Button>
        </CardBody>
      </Card>

      {/* Book Meeting */}
      <Card>
        <CardHeader><h2 className="text-lg font-medium text-gray-900">Book a Meeting</h2></CardHeader>
        <CardBody>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Pick Date</h3>
              <input type="date" className="border rounded-md p-2 w-full" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />

              <h3 className="font-semibold mt-4">Pick User</h3>
              <select className="border rounded-md p-2 w-full" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                <option value="">Select user</option>
                {users.filter((u) => u._id !== user.id).map((u) => (
                  <option key={u._id} value={u._id}>{u.profile?.name || u.email}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4 md:col-span-2">
              <h3 className="font-semibold">Common Free Slots</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {todaysSlots.length === 0 && <div className="text-gray-500">No common slots for this date</div>}
                {todaysSlots.map((slot, idx) => (
                  <button key={idx} className={`border rounded-md p-2 text-left hover:bg-gray-50 ${bookingStart === slot.start.toISOString() ? "bg-blue-100 border-blue-500" : ""}`}
                    onClick={() => { setBookingStart(slot.start.toISOString()); setBookingEnd(slot.end.toISOString()); }}>
                    {slot.label}
                  </button>
                ))}
              </div>

              <h3 className="font-semibold mt-6">Confirm Booking</h3>
              <input type="text" className="border rounded-md p-2 w-full" value={bookingTitle} onChange={(e) => setBookingTitle(e.target.value)} placeholder="Meeting title" />
              <div className="text-sm text-gray-600 mt-1">
                Selected: {bookingStart ? new Date(bookingStart).toLocaleString() : "—"} to {bookingEnd ? new Date(bookingEnd).toLocaleString() : "—"}
              </div>
              <Button className="mt-2" onClick={createBooking}>Create Meeting</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* My Meetings */}
      <Card>
        <CardHeader><h2 className="text-lg font-medium text-gray-900">My Meetings</h2></CardHeader>
        <CardBody>
          {meetings.length === 0 && <div className="text-gray-500">No meetings scheduled</div>}
          {meetings.map((m) => (
            <div key={m._id} className="p-3 border rounded-md flex items-center justify-between">
              <div>
                <div className="font-medium">{m.title}</div>
                <div className="text-sm text-gray-600">{m.slot?.start ? new Date(m.slot.start).toLocaleString() : "N/A"} - {m.slot?.end ? new Date(m.slot.end).toLocaleString() : "N/A"}</div>
              </div>
              {m.participants?.some((p) => p._id === user.id) && m.videoLink && (
                <a
                  href={m.videoLink}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Join Meeting
                </a>
              )}
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
};

export default CalendarPage;
