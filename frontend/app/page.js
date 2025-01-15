import Image from "next/image";
import FullCalendarComponent from '../app/components/FullCalendarComponent'
export default function Home() {
  return (
    <div className="bg-gray-100 p-4">
      <FullCalendarComponent />
    </div>
  );
}
