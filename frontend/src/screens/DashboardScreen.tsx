import SummaryCards from "../widgets/SummaryCards";
import ActivityFeed from "../widgets/ActivityFeed";
import DashboardHero from "../widgets/DashboardHero";
import PendingTransfersWidget from "../widgets/PendingTransfersWidget";
import OpenAnomaliesWidget from "../widgets/OpenAnomaliesWidget";
import RecentImportJobsWidget from "../widgets/RecentImportJobsWidget";
import NearestAvailabilityWidget from "../widgets/NearestAvailabilityWidget";

const DashboardScreen = () => (
  <div className="flex flex-col gap-8">
    <DashboardHero />
    <NearestAvailabilityWidget />
    <SummaryCards />
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <ActivityFeed />
        <RecentImportJobsWidget />
      </div>
      <div className="space-y-6">
        <PendingTransfersWidget />
        <OpenAnomaliesWidget />
      </div>
    </div>
  </div>
);

export default DashboardScreen;
