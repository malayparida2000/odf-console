import * as React from 'react';
import { DataUnavailableError } from '@odf/shared/generic/Error';
import { NamespaceModel } from '@odf/shared/models';
import { ResourceNameWIcon } from '@odf/shared/resource-link/resource-link';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { Trans } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import {
  Bullseye,
  Alert,
  AlertProps,
  Button,
  ButtonVariant,
  Tooltip,
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons';
import { ENROLLED_APP_QUERY_PARAMS_KEY } from '../../constants';
import { DRPlacementControlKind } from '../../types';
import EmptyPage from '../empty-state-page/empty-page';
import { getCurrentActivity } from '../mco-dashboard/disaster-recovery/cluster-app-card/application';
import {
  getAlertMessages,
  isFailingOrRelocating,
  replicationHealthMap,
  SyncStatusInfo,
} from './utils';
import './protected-apps.scss';

type SelectExpandableProps = {
  title: React.ReactNode;
  tooltipContent: string;
  onSelect: (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    buttonRef: React.MutableRefObject<HTMLElement>
  ) => void;
  buttonId: EXPANDABLE_COMPONENT_TYPE;
  className?: string;
};

type DescriptionProps = {
  term: string;
  descriptions: string[] | React.ReactNode[];
};

type DescriptionListProps_ = { columnModifier?: '1Col' | '2Col' | '3Col' };

const DescriptionList_: React.FC<DescriptionListProps_> = ({
  columnModifier,
  children,
}) => {
  return (
    <DescriptionList
      columnModifier={{
        default: columnModifier || '1Col',
      }}
      className="mco-protected-applications__description"
      isCompact
    >
      {children}
    </DescriptionList>
  );
};

const Description: React.FC<DescriptionProps> = ({ term, descriptions }) => {
  return (
    <DescriptionListGroup>
      <DescriptionListTerm>{term}</DescriptionListTerm>
      {descriptions.map((description) => (
        <DescriptionListDescription>{description}</DescriptionListDescription>
      ))}
    </DescriptionListGroup>
  );
};

export const EnrollApplicationButton: React.FC = () => {
  const { t } = useCustomTranslation();
  // ToDo: Update, either just modal or dropdown + modal
  return (
    <div className="pf-u-ml-md">
      <Button variant={ButtonVariant.primary} className="pf-u-mt-md">
        {t('Enroll application')}
      </Button>
    </div>
  );
};

export const EmptyRowMessage: React.FC = () => {
  const { t } = useCustomTranslation();
  return (
    <Bullseye className="pf-u-mt-xl">
      {t('No protected applications found')}
    </Bullseye>
  );
};

export const NoDataMessage: React.FC = () => {
  const { t } = useCustomTranslation();
  return (
    <EmptyPage
      title={t('No protected applications')}
      ButtonComponent={EnrollApplicationButton}
      isLoaded
      canAccess
    >
      <Trans t={t}>
        You do not have any protected applications yet, to add disaster recovery
        protection to your applications start by clicking on the{' '}
        <strong>Enroll application</strong> button.
      </Trans>
    </EmptyPage>
  );
};

export const AlertMessages: React.FC = () => {
  const { t } = useCustomTranslation();

  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const recentlyEnrolledApp = params.get(ENROLLED_APP_QUERY_PARAMS_KEY) ?? '';
  const messages: AlertProps[] = getAlertMessages(
    t,
    recentlyEnrolledApp,
    navigate
  );

  return (
    <>
      {messages.map((message) => (
        <Alert
          variant={message.variant}
          title={message.title}
          className="pf-u-mt-xs pf-u-mb-xs"
          {...(message?.isInline ? { isInline: message.isInline } : {})}
          {...(message?.actionClose
            ? { actionClose: message.actionClose }
            : {})}
        />
      ))}
    </>
  );
};

export const SelectExpandable: React.FC<SelectExpandableProps> = ({
  title,
  tooltipContent,
  onSelect,
  buttonId,
  className,
}) => {
  const buttonRef = React.useRef<HTMLElement>();
  return (
    <Tooltip content={tooltipContent}>
      <Button
        ref={buttonRef}
        variant={ButtonVariant.link}
        onClick={(event) => onSelect(event, buttonRef)}
        id={buttonId}
        className={className}
        isInline
      >
        {title}
      </Button>
    </Tooltip>
  );
};

export enum EXPANDABLE_COMPONENT_TYPE {
  DEFAULT = '',
  NS = 'namespaces',
  EVENTS = 'events',
  STATUS = 'status',
}

export type SyncStatus = { [appName: string]: SyncStatusInfo };

export type ExpandableComponentProps = {
  application?: DRPlacementControlKind;
  syncStatusInfo?: SyncStatusInfo;
};

export const NamespacesDetails: React.FC<ExpandableComponentProps> = ({
  application,
}) => {
  const { t } = useCustomTranslation();

  const enrolledNamespaces: React.ReactNode[] =
    // ToDo: Update with correct spec field which will report all protected namespaces
    // @ts-ignore
    application.spec?.enrolledNamespaces?.map((namespace: string) => (
      <ResourceNameWIcon
        resourceModel={NamespaceModel}
        resourceName={namespace}
      />
    )) || [];
  return (
    <>
      {!enrolledNamespaces.length ? (
        <DataUnavailableError className="pf-u-pt-xl pf-u-pb-xl" />
      ) : (
        <DescriptionList_>
          <Description
            term={t('Namespace')}
            descriptions={enrolledNamespaces}
          />
        </DescriptionList_>
      )}
    </>
  );
};

export const EventsDetails: React.FC<ExpandableComponentProps> = ({
  application,
}) => {
  const { t } = useCustomTranslation();

  // ToDo: Add clean-up activity event as well
  const activity = [
    getCurrentActivity(
      application?.status?.phase,
      application.spec?.failoverCluster,
      application.spec?.preferredCluster,
      t
    ),
  ];
  const status = [
    <>
      <InProgressIcon size={'sm'} /> {t('In progress')}
    </>,
  ];
  return (
    <>
      {!isFailingOrRelocating(application) ? (
        <DataUnavailableError className="pf-u-pt-xl pf-u-pb-xl" />
      ) : (
        <DescriptionList_ columnModifier={'2Col'}>
          <Description
            term={t('Activity description')}
            descriptions={activity}
          />
          <Description term={t('Status')} descriptions={status} />
        </DescriptionList_>
      )}
    </>
  );
};

export const StatusDetails: React.FC<ExpandableComponentProps> = ({
  syncStatusInfo,
}) => {
  const { t } = useCustomTranslation();

  const syncType = [t('Application volumes (PVCs)'), t('Kube objects')];
  const { icon: volIcon, title: volTitle } = replicationHealthMap(
    syncStatusInfo.volumeReplicationStatus,
    t
  );
  const { icon: kubeIcon, title: kubeTitle } = replicationHealthMap(
    syncStatusInfo.kubeObjectReplicationStatus,
    t
  );
  const syncStatus = [
    <>
      {volIcon} {volTitle}
    </>,
    <>
      {kubeIcon} {kubeTitle}
    </>,
  ];
  const lastSyncOn = [
    syncStatusInfo.volumeLastGroupSyncTime,
    syncStatusInfo.kubeObjectLastSyncTime,
  ];
  return (
    <DescriptionList_ columnModifier={'3Col'}>
      <Description term={t('Sync resource type')} descriptions={syncType} />
      <Description term={t('Sync status')} descriptions={syncStatus} />
      <Description term={t('Last synced on')} descriptions={lastSyncOn} />
    </DescriptionList_>
  );
};

export const ExpandableComponentsMap = {
  [EXPANDABLE_COMPONENT_TYPE.DEFAULT]: () => null,
  [EXPANDABLE_COMPONENT_TYPE.NS]: NamespacesDetails,
  [EXPANDABLE_COMPONENT_TYPE.EVENTS]: EventsDetails,
  [EXPANDABLE_COMPONENT_TYPE.STATUS]: StatusDetails,
};
