import Image from "next/image";
import FullCalendarComponent from '../app/components/FullCalendarComponent'
export default function Home() {
  return (
    <div className="bg-gray-100 p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Next.js FullCalendar with Tailwind CSS</h1>
      <FullCalendarComponent />
    </div>
  );
}
