'use client'

import { useState } from "react"
import { Avatar } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { CheckCircle, MapPin, MessageCircle } from "lucide-react"


interface Event {
  id: number;
  type: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
}


const events = [
  {
    id: 1,
    type: "task",
    title: "Follow up with the client",
    description: "Send an email to the client to discuss the project details.",
    createdBy: "John Doe",
    createdAt: "2023-06-10T09:30:00",
  },
  {
    id: 2,
    type: "visit",
    title: "On-site meeting",
    description: "Met with the client at their office to discuss the project requirements.",
    createdBy: "Jane Smith",
    createdAt: "2023-06-08T14:00:00",
  },
  {
    id: 3,
    type: "note",
    title: "Project update",
    description: "The client requested some changes to the project scope.",
    createdBy: "John Doe",
    createdAt: "2023-06-06T11:15:00",
  },
]

const EventIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "task":
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    case "visit":
      return <MapPin className="w-6 h-6 text-blue-500" />;
    case "note":
      return <MessageCircle className="w-6 h-6 text-yellow-500" />;
    default:
      return null;
  }
};

const EventCard = ({ event }: { event: Event }) => {
  const { type, title, description, createdBy, createdAt } = event;
  const formattedDate = format(new Date(createdAt), "MMM d, yyyy");

  return (
    <Card className="mb-2">
      <CardContent className="flex items-center p-3">
        <div className="flex items-center">
          <EventIcon type={type} />
          <div className="ml-3">
            <p className="text-sm text-gray-800 font-medium">{title}</p>
            <div className="text-xs text-gray-500 mt-1">
              <span>{createdBy}</span>
              <span className="mx-1">•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function TimelineOverview({ storeId }: { storeId: string }) {
  return (
    <div className="container mx-auto py-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Activity</h2>
      <div className="space-y-2">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}