import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { DataProxy } from 'apollo-cache';
import { WatchQueryFetchPolicy } from 'apollo-client';
import { ExecutionResult } from 'apollo-link';
import { DocumentNode } from 'graphql/language/ast';
import { merge, Observable } from 'rxjs';
import { delay, distinctUntilChanged, filter, map, skip, takeUntil } from 'rxjs/operators';

import { CustomFields, GetUserStatus } from '../../common/generated-types';
import { LocalStorageService } from '../../core/providers/local-storage/local-storage.service';
import { addCustomFields } from '../add-custom-fields';
import { GET_USER_STATUS } from '../definitions/client-definitions';
import { QueryResult } from '../query-result';
import { ServerConfigService } from '../server-config';

/**
 * Make the MutationUpdaterFn type-safe until this issue is resolved: https://github.com/apollographql/apollo-link/issues/616
 */
export type TypedFetchResult<T = Record<string, any>> = ExecutionResult & {
    context?: T;
    data: T;
};
export type TypedMutationUpdateFn<T> = (proxy: DataProxy, mutationResult: TypedFetchResult<T>) => void;

@Injectable()
export class BaseDataService {
    constructor(
        private apollo: Apollo,
        private httpClient: HttpClient,
        private localStorageService: LocalStorageService,
        private serverConfigService: ServerConfigService,
    ) {}

    private get customFields(): CustomFields {
        return this.serverConfigService.serverConfig.customFieldConfig || {};
    }

    /**
     * Performs a GraphQL watch query
     */
    query<T, V = Record<string, any>>(
        query: DocumentNode,
        variables?: V,
        fetchPolicy: WatchQueryFetchPolicy = 'cache-and-network',
    ): QueryResult<T, V> {
        const withCustomFields = addCustomFields(query, this.customFields);
        const queryRef = this.apollo.watchQuery<T, V>({
            query: withCustomFields,
            variables,
            fetchPolicy,
        });
        const queryResult = new QueryResult<T, any>(queryRef, this.apollo);
        return queryResult;
    }

    /**
     * Performs a GraphQL mutation
     */
    mutate<T, V = Record<string, any>>(
        mutation: DocumentNode,
        variables?: V,
        update?: TypedMutationUpdateFn<T>,
    ): Observable<T> {
        const withCustomFields = addCustomFields(mutation, this.customFields);
        return this.apollo
            .mutate<T, V>({
                mutation: withCustomFields,
                variables,
                update: update as any,
            })
            .pipe(map(result => result.data as T));
    }
}
