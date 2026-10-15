import { Navigate } from 'react-router';
import {
  COURIER_PROFILE_STATUS,
  CourierProfileError,
  useCourierProfile,
  useCourierProfileStatus,
} from '@/entities/courier';
import { APP_ROUTES } from '@/shared/routes';
import { ContentLoader } from '@/shared/ui/page-loader';
import { PageTitle } from '@/shared/ui/page-title';
import { COURIER_WORK_TEXTS } from '../config/texts';
import { ConnectionAlert } from './ConnectionAlert';

export function CourierWorkPage() {
  const status = useCourierProfileStatus();
  const profile = useCourierProfile();

  // The page waits for the profile, so a courier without a vehicle never sees it flash.
  if (status === COURIER_PROFILE_STATUS.LOADING) {
    return <ContentLoader />;
  }

  // Without a vehicle the courier cannot go on the line: the vehicle comes first.
  if (profile !== null && profile.vehicle === null) {
    return <Navigate to={APP_ROUTES.COURIER_VEHICLE} replace />;
  }

  return (
    <div className="flex max-w-276 flex-col gap-6 lg:gap-8">
      <PageTitle>{COURIER_WORK_TEXTS.PAGE_TITLE}</PageTitle>
      <ConnectionAlert />
      {profile === null ? <CourierProfileError /> : null}
    </div>
  );
}
