import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/landing/LegalPage";
import { SEO } from "@/components/seo/SEO";

export const Route = createFileRoute("/shipping-policy")({
  component: ShippingPolicyPage,
});

function ShippingPolicyPage() {
  return (
    <>
      <SEO
        title="Shipping Policy — Fast Delivery Across Pakistan"
        description="Kifayat ships Pakistan-wide. 2–4 day delivery in Karachi, nationwide dispatch, free shipping over Rs 2,500. Learn about tracking, fees, and failed deliveries."
        path="/shipping-policy"
        keywords="Kifayat shipping, delivery Pakistan, free shipping Karachi, COD Pakistan, parcel tracking"
      />
    <LegalPage
      title="Shipping Policy"
      subtitle="Pakistan-wide delivery with real-time tracking and transparent fees."
      effectiveDate="1 July 2026"
      related={[
        { label: "Return & Refund Policy", to: "/return-policy" },
        { label: "Terms & Conditions", to: "/terms" },
      ]}
      sections={[
        {
          heading: "Coverage Area",
          body: [
            "Kifayat delivers to all cities and towns across Pakistan.",
            "Same-day and next-day delivery windows are available within Karachi metropolitan area for eligible orders.",
            "Remote areas and far-flung regions may experience extended delivery times of up to 7–10 business days. You will be notified at checkout if your area qualifies.",
          ],
        },
        {
          heading: "Delivery Timeframes",
          body: [
            "Karachi same-day: available on eligible orders placed before 12:00 PM. Not available for all items.",
            "Karachi next-day: orders placed before 2:00 PM on business days.",
            "Major cities (Lahore, Islamabad, Rawalpindi, Faisalabad, Multan): 2–3 business days.",
            "All other cities and towns: 3–5 business days.",
            "Remote areas: 5–10 business days.",
            "Timeframes are estimates and begin from the point of dispatch, not order placement. Orders typically dispatch within 1 business day of confirmation.",
            "Business days exclude Sundays and public holidays.",
          ],
        },
        {
          heading: "Shipping Fees",
          body: [
            "First order, every customer: FREE delivery — on us. No code needed, it applies automatically at checkout.",
            "Standard delivery Pakistan-wide: FREE on orders above Rs 2,500.",
            "Standard delivery below Rs 2,500: Rs 200 flat fee.",
            "Express next-day, Karachi only: Rs 350 flat fee, regardless of order value.",
            "Same-day Karachi only: Rs 500 flat fee.",
            "Shipping fees are non-refundable except where the return is due to our error such as wrong or damaged item.",
          ],
        },
        {
          heading: "Order Processing",
          body: [
            "Orders are typically processed and dispatched within 1 business day of payment confirmation.",
            "COD orders may take an additional 24 hours for verification before dispatch.",
            "During peak periods (sales events, Eid, etc.), processing times may extend to 2–3 business days. We will notify you of any significant delays.",
            "You will receive an SMS and email confirmation once your order has been dispatched.",
          ],
        },
        {
          heading: "Order Tracking",
          body: [
            "A tracking number and courier link will be sent via SMS and email at the time of dispatch.",
            "Live tracking is also available under My Account then Orders.",
            "If your tracking shows delivered but you have not received your order, you must contact us within 24 hours. Claims submitted after 48 hours of the marked delivery date may not be accepted.",
          ],
        },
        {
          heading: "Failed & Refused Deliveries",
          callout: "Refusing a delivery that you placed does not entitle you to a refund of shipping costs.",
          body: [
            "If a delivery attempt fails because no one was available, the courier will attempt redelivery once. A notification will be sent to the phone number on file.",
            "After two failed attempts, the package is returned to our warehouse. A refund will be issued minus a Rs 300 return handling fee.",
            "If you refuse delivery at the door for a COD order, a Rs 300 handling fee will apply.",
            "Prepaid orders that are refused at delivery will be refunded to the original payment method, minus the Rs 300 handling fee.",
            "Repeated refusals will result in restriction to prepaid orders only.",
          ],
        },
        {
          heading: "Address Accuracy",
          callout: "You are solely responsible for the accuracy of the delivery address provided at checkout.",
          body: [
            "Kifayat is not liable for delayed or failed deliveries resulting from incomplete, incorrect, or unverifiable addresses.",
            "Address changes after dispatch cannot be guaranteed and are subject to courier availability.",
            "If your order is returned due to an incorrect address, reshipping will incur a fresh delivery fee.",
          ],
        },
        {
          heading: "Risk of Loss",
          body: "Title and risk of loss for all products pass to you upon delivery, as confirmed by the courier's delivery record. If you believe your package was stolen after a confirmed delivery, please contact us and your local authorities.",
        },
        {
          heading: "Shipping Delays & Force Majeure",
          body: [
            "Kifayat is not liable for shipping delays caused by circumstances beyond our reasonable control, including natural disasters, floods, strikes, courier operational failures, government actions, or public health emergencies.",
            "During Ramadan, Eid, and other national holidays, delivery timelines may be extended. We will post advance notice on the website.",
            "If your order is significantly delayed beyond the estimated timeframe, contact support@kifayat.com for an update.",
          ],
        },
        {
          heading: "Restricted & Prohibited Items",
          body: [
            "We do not ship hazardous materials, flammable substances, weapons, or any items prohibited under Pakistani law.",
            "Certain items may not be available for delivery to specific regions due to local regulations.",
            "Orders containing restricted items may be cancelled and refunded at our discretion.",
          ],
        },
        {
          heading: "Contact for Shipping Issues",
          body: "For any shipping-related queries, tracking issues, or non-delivery claims, contact support@kifayat.com or reach us on WhatsApp at the number listed on our Contact page. Please have your order number ready.",
        },
      ]}
    />
    </>
  );
}
