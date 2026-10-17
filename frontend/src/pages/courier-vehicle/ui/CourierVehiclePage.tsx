import {
  COURIER_PROFILE_STATUS,
  CourierProfileError,
  useCourierProfile,
  useCourierProfileStatus,
} from '@/entities/courier';
import { ContentLoader } from '@/shared/ui/page-loader';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { PageTitle } from '@/shared/ui/page-title';
import { COURIER_VEHICLE_TEXTS } from '../config/texts';
import { VehicleForm } from './VehicleForm';

export function CourierVehiclePage() {
  const status = useCourierProfileStatus();
  const profile = useCourierProfile();

  // The form takes the current vehicle once, so it waits for the profile.
  if (status === COURIER_PROFILE_STATUS.LOADING) {
    return <ContentLoader />;
  }

  return (
    <div className="flex max-w-160 flex-col gap-6 lg:gap-8">
      <PageTitle>{COURIER_VEHICLE_TEXTS.PAGE_TITLE}</PageTitle>
      {profile === null ? (
        <CourierProfileError />
      ) : (
        <>
          {profile.vehicle === null ? (
            <InlineAlert variant="info" title={COURIER_VEHICLE_TEXTS.NO_VEHICLE} />
          ) : null}
          <VehicleForm vehicle={profile.vehicle} />
        </>
      )}
    </div>
  );
}
