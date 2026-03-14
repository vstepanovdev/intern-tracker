import type { Status } from "../types";

const colorMap: Record<Status, string> = {
  wishlist: "bg-gray-100 text-gray-700",
  applied: "bg-blue-100 text-blue-700",
  phone_screen: "bg-yellow-100 text-yellow-700",
  interview: "bg-purple-100 text-purple-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-orange-100 text-orange-700",
};

const labelMap: Record<Status, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  phone_screen: "Phone Screen",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[status] || "bg-gray-100 text-gray-700"}`}
    >
      {labelMap[status] || status}
    </span>
  );
}
