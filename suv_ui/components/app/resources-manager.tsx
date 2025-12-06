"use client";

import { useEffect, useState } from "react";
import {
  fetchVolunteerResources,
  createResource,
  updateResource,
  deleteResource,
  fetchEvents,
  fetchAllVolunteers,
} from "@/lib/api-client";
import type { ResourceAvailable, Event, Volunteer } from "@/lib/types";

interface ResourcesManagerProps {
  volunteerId: number;
}

export function ResourcesManager({ volunteerId }: ResourcesManagerProps) {
  const [resources, setResources] = useState<ResourceAvailable[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingResource, setEditingResource] =
    useState<ResourceAvailable | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    resource_type: "equipment",
    quantity: 1,
    description: "",
    status: "available",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadResources();
    loadEvents();
    loadVolunteers();
  }, [volunteerId]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await fetchVolunteerResources(volunteerId);
      setResources(data);
    } catch (error) {
      console.error("Failed to load resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const data = await fetchEvents();
      setEvents(
        data.filter((e) => e.status === "active" || e.status === "pending")
      );
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  };

  const loadVolunteers = async () => {
    try {
      const data = await fetchAllVolunteers();
      setVolunteers(data);
    } catch (error) {
      console.error("Failed to load volunteers:", error);
    }
  };

  const handleOpenAddDialog = () => {
    setFormData({
      name: "",
      resource_type: "equipment",
      quantity: 1,
      description: "",
      status: "available",
    });
    setEditingResource(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (resource: ResourceAvailable) => {
    setFormData({
      name: resource.name,
      resource_type: resource.resource_type,
      quantity: resource.quantity,
      description: resource.description,
      status: resource.status,
    });
    setEditingResource(resource);
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingResource) {
        // Update existing resource
        await updateResource(editingResource.id, formData);
      } else {
        // Create new resource
        await createResource({
          ...formData,
          volunteer_id: volunteerId,
        });
      }

      await loadResources();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to save resource:", error);
      alert("Failed to save resource. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resourceId: number) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      await deleteResource(resourceId);
      await loadResources();
    } catch (error) {
      console.error("Failed to delete resource:", error);
      alert("Failed to delete resource. Please try again.");
    }
  };

  const resourceTypes = [
    { value: "equipment", label: "Equipment" },
    { value: "vehicle", label: "Vehicle" },
    { value: "supplies", label: "Supplies" },
    { value: "other", label: "Other" },
  ];

  const statusOptions = [
    { value: "available", label: "Available" },
    { value: "in_use", label: "In Use" },
    { value: "maintenance", label: "Maintenance" },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">My Resources</h3>
        <div className="flex items-center justify-center py-8">
          <div className="inline-block w-6 h-6 border-3 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">My Resources</h3>
          <button
            onClick={handleOpenAddDialog}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Resource
          </button>
        </div>

        {resources.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p className="text-sm">No resources added yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Add equipment, vehicles, or supplies you can offer
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => {
              const assignedEvent = resource.event_id
                ? events.find((e) => e.id === resource.event_id)
                : null;
              const allocatedVolunteer = volunteers.find(
                (v) => v.id === resource.volunteer_id
              );

              return (
                <div
                  key={resource.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {resource.name}
                        </h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {resource.resource_type}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            resource.status === "available"
                              ? "bg-green-100 text-green-800"
                              : resource.status === "in_use"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {resource.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {resource.description}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        Quantity: {resource.quantity}
                      </p>

                      {assignedEvent ? (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 bg-blue-50 border border-blue-200 rounded px-2 py-1.5">
                            <p className="text-xs text-blue-700">
                              <span className="font-medium">Assigned to:</span>{" "}
                              {assignedEvent.description}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleOpenEditDialog(resource)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingResource ? "Edit Resource" : "Add New Resource"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., First Aid Kit, Pickup Truck"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    required
                    value={formData.resource_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        resource_type: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {resourceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe the resource..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? "Saving..."
                      : editingResource
                      ? "Update"
                      : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
