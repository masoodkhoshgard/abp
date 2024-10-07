import { ConfigStateService, PermissionService } from '@abp/ng.core';
import { Observable, of } from 'rxjs';
import { EXTRA_PROPERTIES_KEY } from '../constants/extra-properties';
import {
  EntityPropContributorCallbacks,
  EntityPropDefaults,
  EntityProps,
  EntityPropsFactory,
} from '../models/entity-props';
import {
  CreateFormPropContributorCallbacks,
  CreateFormPropDefaults,
  CreateFormPropsFactory,
  EditFormPropContributorCallbacks,
  EditFormPropDefaults,
  EditFormPropsFactory,
  FormProps,
} from '../models/form-props';
import {
  InferredProp,
  PropCallback,
  PropContributorCallback,
  PropList,
  PropsFactory,
} from '../models/props';
import { PolicyGroup } from '../models/internal/object-extensions';
import { ObjectExtensions } from '../models/object-extensions';

export function createExtraPropertyValueResolver<T>(
  name: string,
): PropCallback<T, Observable<any>> {
  return (data?) => of((data.record as { [key: string]: any })[EXTRA_PROPERTIES_KEY][name]);
}

export function mergeWithDefaultProps<F extends PropsFactory<any>>(
  extension: F,
  defaultProps: InferredPropDefaults<F>,
  ...contributors: InferredPropContributorCallbacks<F>[]
) {
  Object.keys(defaultProps).forEach((name: string) => {
    const props: InferredProps<F> = extension.get(name);
    props.clearContributors();
    props.addContributor((propList: PropList<any, InferredProp<any>>) =>
      propList.addManyTail(defaultProps[name]),
    );
    contributors.forEach(contributor =>
      (contributor[name] || []).forEach((callback: PropContributorCallback<any>) =>
        props.addContributor(callback),
      ),
    );
  });
}

function isPolicyMet(
  checkFunction: (item: string) => boolean,
  requiresAll: boolean,
  items?: string[],
): boolean {
  if (!items?.length) {
    return true;
  }
  return requiresAll ? items.every(checkFunction) : items.some(checkFunction);
}

export function checkPolicyProperties(
  properties: ObjectExtensions.EntityExtensionProperties,
  configState: ConfigStateService,
  permissionService: PermissionService,
) {
  const checkPolicy = (policy: PolicyGroup): boolean => {
    const { permissions, globalFeatures, features } = policy;

    const checks = [
      {
        items: permissions?.permissionNames,
        requiresAll: permissions?.requiresAll,
        check: (item: string) => permissionService.getGrantedPolicy(item),
      },
      {
        items: globalFeatures?.features,
        requiresAll: globalFeatures?.requiresAll,
        check: (item: string) => configState.getGlobalFeatureIsEnabled(item),
      },
      {
        items: features?.features,
        requiresAll: features?.requiresAll,
        check: (item: string) => configState.getFeatureIsEnabled(item),
      },
    ];

    return checks.every(({ items, requiresAll, check }) =>
      isPolicyMet(check, requiresAll ?? false, items),
    );
  };

  Object.entries(properties).forEach(([name, property]) => {
    if (property.policy && !checkPolicy(property.policy)) {
      delete properties[name];
    }
  });
}

type InferredPropDefaults<F> =
  F extends EntityPropsFactory<infer RE>
    ? EntityPropDefaults<RE>
    : F extends CreateFormPropsFactory<infer RCF>
      ? CreateFormPropDefaults<RCF>
      : F extends EditFormPropsFactory<infer REF>
        ? EditFormPropDefaults<REF>
        : never;

type InferredPropContributorCallbacks<F> =
  F extends EntityPropsFactory<infer RE>
    ? EntityPropContributorCallbacks<RE>
    : F extends CreateFormPropsFactory<infer RCF>
      ? CreateFormPropContributorCallbacks<RCF>
      : F extends EditFormPropsFactory<infer REF>
        ? EditFormPropContributorCallbacks<REF>
        : never;

type InferredProps<F> =
  F extends EntityPropsFactory<infer RE>
    ? EntityProps<RE>
    : F extends CreateFormPropsFactory<infer RCF>
      ? FormProps<RCF>
      : F extends EditFormPropsFactory<infer REF>
        ? FormProps<REF>
        : never;
