  // The public "listing detail" page for one property (/listing/:id). Shows
  // the full description, price, amenities, and location, plus an
  // action panel on the side: tenants get a "Send Inquiry" button, the
  // owning renter gets an "Edit Property" button instead.
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
  import Seo from "../../components/Seo";

  // Hero is roughly 2/3 of the max-w-7xl (1280px) container on large
  // screens (lg:col-span-2 of 3), full width below that.
  const HERO_SIZES = "(min-width: 1024px) 66vw, 100vw";

  export default function ListingDetail() {
    // :id comes from the route, e.g. /listing/64f...  (see App.jsx's route table).
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [prop, setProp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
    // Tracks whether the hero <img> failed to load, so a "No Image
    // Available" placeholder can be shown instead of a broken image icon.
    const [heroImgError, setHeroImgError] = useState(false);
    const { options } = useListingOptions();

    // Re-fetches whenever the :id in the URL changes (e.g. navigating from
    // one listing straight to another via a link, without unmounting this
    // component first).
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
        <div className="flex justify-center items-center h-[70vh] bg-bg text-fg-secondary">
          Property not found
        </div>
      );
    }

    // Only logged-in tenants can send an inquiry; renters (including the
    // owner) never see the inquiry button - they see the edit button instead.
    const canInquire = user && user.role === "tenant";
    const photo = getPrimaryPhoto(prop);
    const priceText = prop.price ? `₹${prop.price}/month` : "Contact for price";
    const seoDescription = `${prop.title} in ${prop.location?.address || "India"} - ${priceText}. ${prop.propertyType} for ${prop.targetAudience === "co-ed" ? "co-ed" : prop.targetAudience}.`;

    return (
      <>
        <Seo
          title={prop.title}
          description={seoDescription}
          image={photo?.src}
          url={typeof window !== "undefined" ? window.location.href : undefined}
        />
        <div className="min-h-screen bg-bg text-fg">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-surface rounded-md shadow overflow-hidden">
                {photo && !heroImgError ? (
                  <div className="w-full aspect-[8/5]">
                    {/* Largest image on this page and the first thing a
                        visitor sees, so it's loaded eagerly/high-priority
                        rather than lazily - same reasoning as home.jsx's
                        hero image. srcSet/sizes let the browser pick the
                        right resolution for the viewport instead of always
                        downloading the biggest variant. */}
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
                  <div className="w-full aspect-[8/5] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-fg-secondary">
                    No Image Available
                  </div>
                )}

                <div className="p-6">
                  <div className="flex flex-wrap items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold">{prop.title}</h1>
                    <div className="flex gap-2 mt-2">
                      {prop.propertyType && (
                        <span className="px-3 py-1 bg-accent-subtle text-accent-subtle-fg rounded-sm text-xs font-medium">
                          {prop.propertyType}
                        </span>
                      )}
                      {prop.targetAudience && (
                        <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-fg-secondary rounded-sm text-xs font-medium capitalize">
                          {prop.targetAudience}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-fg-secondary leading-relaxed">
                    {prop.description || "No description provided."}
                  </p>

                  <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                    <div>
                      <h2 className="text-fg-secondary font-medium mb-1 text-sm">Price</h2>
                      <p className="text-lg font-semibold text-fg">
                        {prop.price ? `₹${prop.price} / month` : "Contact for price"}
                      </p>
                    </div>

                    <div>
                      <h2 className="text-fg-secondary font-medium mb-1 text-sm">Furnishing</h2>
                      <p className="capitalize text-fg">
                        {prop.furnishing || "—"}
                      </p>
                    </div>

                    <div>
                      <h2 className="text-fg-secondary font-medium mb-1 text-sm">Meals</h2>
                      <p className="capitalize text-fg">
                        {prop.mealsProvided ? "Included" : "Not included"}
                      </p>
                    </div>

                    <div>
                      <h2 className="text-fg-secondary font-medium mb-1 text-sm">Pets</h2>
                      <p className="capitalize text-fg">
                        {prop.petsAllowed ? "Allowed" : "Not allowed"}
                      </p>
                    </div>

                    <div>
                      <h2 className="text-fg-secondary font-medium mb-1 text-sm">Status</h2>
                      <p
                        className={`capitalize font-medium ${
                          prop.status === "available"
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {prop.status || "—"}
                      </p>
                    </div>

                    <div>
                      <h2 className="text-fg-secondary font-medium mb-1 text-sm">Rooms</h2>
                      <p className="text-fg">{prop.totalRooms || "—"}</p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h2 className="text-fg font-semibold mb-3">Amenities</h2>
                    <div className="flex flex-wrap gap-2">
                      {prop.amenities && prop.amenities.length > 0 ? (
                        prop.amenities.map((a) => (
                          <span
                            key={a}
                            className="bg-neutral-100 dark:bg-neutral-800 text-fg-secondary px-3 py-1 rounded-sm text-xs"
                          >
                            {/* amenities are stored as canonical slugs (e.g.
                                "wifi"); amenityLabel() turns that back into
                                the human-readable label using the option
                                list from useListingOptions(). */}
                            {amenityLabel(options, a)}
                          </span>
                        ))
                      ) : (
                        <span className="text-fg-secondary text-sm">
                          No amenities listed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-8">
                    <h2 className="text-fg font-semibold mb-2">Location</h2>
                    <p className="text-fg-secondary text-sm mb-3">
                      {prop.location?.address || "Address not available"}
                    </p>
                    {prop.location?.googleMapsUrl && (
                      <a
                        href={prop.location.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block px-4 py-2 rounded-sm bg-accent hover:bg-accent-hover text-accent-fg text-sm transition-colors"
                      >
                        View on Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <aside className="bg-surface rounded-md shadow p-6 h-fit">

                {/* Shown only to the logged-in owner of this exact property
                    (not just any renter) - checks the user is not a tenant,
                    is logged in, and their id matches prop.owner._id. */}
                {
                  !canInquire
                  && user
                  && (prop.owner._id === user.id)
                    && (
                      <button
                      onClick={() => setShowEditPropertyModal(true)}
                      className="w-full py-3 rounded-sm bg-accent hover:bg-accent-hover text-accent-fg font-semibold transition-colors"
                    >
                      Edit Property
                    </button>
                    )
                }

                <div className="bg-accent text-accent-fg rounded-md p-4 text-center my-6">
                  <h2 className="text-lg font-semibold">Contact Renter</h2>
                  <p className="text-sm mt-1 opacity-90">
                    Interested? Send an inquiry!
                  </p>
                </div>

                {prop.owner && (
                  <div className="space-y-2 text-fg mb-6">
                    <p className="font-medium">{prop.owner.name}</p>
                    <p className="text-sm text-fg-secondary">{prop.owner.email}</p>
                    {prop.owner.phone && (
                      <p className="text-sm text-fg-secondary">{prop.owner.phone}</p>
                    )}
                  </div>
                )}


                {/* Three possible states here: a tenant sees "Send Inquiry",
                    a logged-in non-tenant (i.e. a renter who isn't the
                    owner) sees an explanatory message, and a logged-out
                    visitor sees a login link instead. */}
                {canInquire ? (
                  <button
                    onClick={() => setShowInquiryModal(true)}
                    className="w-full py-3 rounded-sm bg-accent hover:bg-accent-hover text-accent-fg font-semibold transition-colors"
                  >
                    Send Inquiry
                  </button>
                ) : (
                  <div className="text-sm text-fg-secondary text-center">
                    {user ? (
                      "Only tenants can send inquiries"
                    ) : (
                      <a href="/login" className="text-accent hover:underline">
                        Login to send inquiry
                      </a>
                    )}
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>

        {/* Both modals are always mounted in the tree (not conditionally
            rendered based on showX state alone) so they can control their
            own open/close transitions via isOpen - only one of the two
            ever applies to a given viewer, gated by !canInquire / canInquire. */}
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