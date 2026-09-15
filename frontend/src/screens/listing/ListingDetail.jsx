  import React, { useEffect, useState, useContext } from "react";
  import { useParams } from "react-router-dom";
  import { fetchPropertyById } from "../../api/properties";
  import { AuthContext } from "../../context/AuthContextObject";
  import InquiryModal from "../../components/InquiryModal";
  import EditPropertyModal from "../../components/EditPropertyModal";
  import ListingDetailSkeleton from "../../components/ListingDetailSkeleton";
  import { getPrimaryPhoto } from "../../utils/images";
  import { amenityLabel } from "../../api/meta";
  import useListingOptions from "../../hooks/useListingOptions";

  // Hero is roughly 2/3 of the max-w-7xl (1280px) container on large
  // screens (lg:col-span-2 of 3), full width below that.
  const HERO_SIZES = "(min-width: 1024px) 66vw, 100vw";

  export default function ListingDetail() {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [prop, setProp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
    const [heroImgError, setHeroImgError] = useState(false);
    const { options } = useListingOptions();

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
      return <ListingDetailSkeleton />;
    }

    if (!prop) {
      return (
        <div className="flex justify-center items-center h-[70vh] text-gray-500">
          Property not found
        </div>
      );
    }

    const canInquire = user && user.role === "tenant";
    const photo = getPrimaryPhoto(prop);

    return (
      <>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow overflow-hidden">
              {photo && !heroImgError ? (
                <div className="w-full aspect-[8/5]">
                  <img
                    src={photo.src}
                    srcSet={photo.srcSet}
                    sizes={photo.srcSet ? HERO_SIZES : undefined}
                    alt={prop.title}
                    className="w-full h-full object-cover"
                    width={photo.width || 1600}
                    height={photo.height || 1000}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    onError={() => setHeroImgError(true)}
                  />
                </div>
              ) : (
                <div className="w-full aspect-[8/5] bg-gray-100 flex items-center justify-center text-gray-500">
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
                    <h2 className="text-gray-500 font-medium mb-1 text-sm">Price</h2>
                    <p className="text-lg font-semibold text-gray-900">
                      {prop.price ? `₹${prop.price} / month` : "Contact for price"}
                    </p>
                  </div>

                  <div>
                    <h2 className="text-gray-500 font-medium mb-1 text-sm">Furnishing</h2>
                    <p className="capitalize text-gray-700">
                      {prop.furnishing || "—"}
                    </p>
                  </div>

                  <div>
                    <h2 className="text-gray-500 font-medium mb-1 text-sm">Meals</h2>
                    <p className="capitalize text-gray-700">
                      {prop.mealsProvided ? "Included" : "Not included"}
                    </p>
                  </div>

                  <div>
                    <h2 className="text-gray-500 font-medium mb-1 text-sm">Pets</h2>
                    <p className="capitalize text-gray-700">
                      {prop.petsAllowed ? "Allowed" : "Not allowed"}
                    </p>
                  </div>

                  <div>
                    <h2 className="text-gray-500 font-medium mb-1 text-sm">Status</h2>
                    <p
                      className={`capitalize font-medium ${
                        prop.status === "available"
                          ? "text-green-700"
                          : "text-red-600"
                      }`}
                    >
                      {prop.status || "—"}
                    </p>
                  </div>

                  <div>
                    <h2 className="text-gray-500 font-medium mb-1 text-sm">Rooms</h2>
                    <p className="text-gray-700">{prop.totalRooms || "—"}</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-gray-700 font-semibold mb-3">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {prop.amenities && prop.amenities.length > 0 ? (
                      prop.amenities.map((a) => (
                        <span
                          key={a}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                        >
                          {amenityLabel(options, a)}
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
                  <h2 className="text-gray-700 font-semibold mb-2">Location</h2>
                  <p className="text-gray-600 text-sm mb-3">
                    {prop.location?.address || "Address not available"}
                  </p>
                  {prop.location?.googleMapsUrl && (
                    <a
                      href={prop.location.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-4 py-2 rounded-lg bg-primary-dark hover:bg-primary text-white text-sm transition"
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
                && user
                && (prop.owner._id === user.id)
                  && (
                    <button
                    onClick={() => setShowEditPropertyModal(true)}
                    className="w-full py-3 rounded-lg bg-primary-dark hover:bg-primary text-white font-semibold transition"
                  >
                    Edit Property
                  </button>
                  )
              }

              <div className="bg-gradient-to-r from-primary-dark to-sky-700 text-white rounded-xl p-4 text-center my-6">
                <h2 className="text-lg font-semibold">Contact Renter</h2>
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
                  className="w-full py-3 rounded-lg bg-primary-dark hover:bg-primary text-white font-semibold transition"
                >
                  Send Inquiry
                </button>
              ) : (
                <div className="text-sm text-gray-500 text-center">
                  {user ? (
                    "Only tenants can send inquiries"
                  ) : (
                    <a href="/login" className="text-primary-dark hover:underline">
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