  import React, { useEffect, useState, useContext } from "react";
  import { useParams } from "react-router-dom";
  import { fetchPropertyById } from "../../api/properties";
  import { AuthContext } from "../../context/AuthContext";
  import InquiryModal from "../../components/InquiryModal";
  import EditPropertyModal from "../../components/EditPropertyModal";
  

  export default function ListingDetail() {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [prop, setProp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);

    useEffect(() => {
      loadProperty();
    }, [id]);

    async function loadProperty() {
      setLoading(true);
      try {
        const data = await fetchPropertyById(id);
        setProp(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center h-[70vh] text-gray-500">
          Loading property details...
        </div>
      );
    }

    if (!prop) {
      return (
        <div className="flex justify-center items-center h-[70vh] text-gray-500">
          Property not found
        </div>
      );
    }

    const canInquire = user && user.role === "tenant";

    return (
      <>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow overflow-hidden">
              {prop.photos && prop.photos.length > 0 ? (
                <div className="h-80 w-full">
                  <img
                    src={prop.photos[0]}
                    alt={prop.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-80 w-full bg-gray-100 flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}

              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{prop.title}</h1>
                  <div className="flex gap-2 mt-2">
                    {prop.propertyType && (
                      <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                        {prop.propertyType}
                      </span>
                    )}
                    {prop.targetAudience && (
                      <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium capitalize">
                        {prop.targetAudience}
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-gray-600 leading-relaxed">
                  {prop.description || "No description provided."}
                </p>

                <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                  <div>
                    <h4 className="text-gray-500 font-medium mb-1">Price</h4>
                    <p className="text-lg font-semibold text-gray-900">
                      {prop.price ? `₹${prop.price} / month` : "Contact for price"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-gray-500 font-medium mb-1">Furnishing</h4>
                    <p className="capitalize text-gray-700">
                      {prop.furnishing || "—"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-gray-500 font-medium mb-1">Meals</h4>
                    <p className="capitalize text-gray-700">
                      {prop.mealsProvided ? "Included" : "Not included"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-gray-500 font-medium mb-1">Pets</h4>
                    <p className="capitalize text-gray-700">
                      {prop.petsAllowed ? "Allowed" : "Not allowed"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-gray-500 font-medium mb-1">Status</h4>
                    <p
                      className={`capitalize font-medium ${
                        prop.status === "available"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {prop.status || "—"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-gray-500 font-medium mb-1">Rooms</h4>
                    <p className="text-gray-700">{prop.totalRooms || "—"}</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-gray-700 font-semibold mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {prop.amenities && prop.amenities.length > 0 ? (
                      prop.amenities.map((a) => (
                        <span
                          key={a}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                        >
                          {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">
                        No amenities listed
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-gray-700 font-semibold mb-2">Location</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    {prop.location?.address || "Address not available"}
                  </p>
                  {prop.location?.googleMapsUrl && (
                    <a
                      href={prop.location.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm transition"
                    >
                      View on Google Maps
                    </a>
                  )}
                </div>
              </div>
            </div>

            <aside className="bg-white rounded-2xl shadow p-6 h-fit">
              
              {
                !canInquire
                && (prop.owner._id == user.id) 
                  && (
                    <button
                    onClick={() => setShowEditPropertyModal(true)}
                    className="w-full py-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold transition"
                  >
                    Edit Property
                  </button>
                  )
              }

              <div className="bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-xl p-4 text-center my-6">
                <h3 className="text-lg font-semibold">Contact Renter</h3>
                <p className="text-sm mt-1 opacity-90">
                  Interested? Send an inquiry!
                </p>
              </div>

              {prop.owner && (
                <div className="space-y-2 text-gray-700 mb-6">
                  <p className="font-medium">{prop.owner.name}</p>
                  <p className="text-sm text-gray-500">{prop.owner.email}</p>
                  {prop.owner.phone && (
                    <p className="text-sm text-gray-500">{prop.owner.phone}</p>
                  )}
                </div>
              )}


              {canInquire ? (
                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="w-full py-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold transition"
                >
                  Send Inquiry
                </button>
              ) : (
                <div className="text-sm text-gray-500 text-center">
                  {user ? (
                    "Only tenants can send inquiries"
                  ) : (
                    <a href="/login" className="text-sky-500 hover:underline">
                      Login to send inquiry
                    </a>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>

        {!canInquire && (
          <EditPropertyModal
            isOpen={showEditPropertyModal}
            onClose={() => setShowEditPropertyModal(false)}
            propertyId={id}
            onSuccess={() => {
              alert("Property edited successfully!");
            }}
          />
        )}

        {canInquire && (
          <InquiryModal
            isOpen={showInquiryModal}
            onClose={() => setShowInquiryModal(false)}
            propertyId={id}
            onSuccess={() => {
              alert("Inquiry sent successfully!");
            }}
          />
        )}

        
      </>
    );
  }