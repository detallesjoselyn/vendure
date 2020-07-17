import { awaitPromiseOrObservable } from '../utils';

import { StateMachineConfig } from './types';

/**
 * @description
 * A simple type-safe finite state machine
 *
 * @docsCategory StateMachine
 */
export class FSM<T extends string, Data = any> {
    private readonly _initialState: T;
    private _currentState: T;

    constructor(private config: StateMachineConfig<T, Data>, initialState: T) {
        this._currentState = initialState;
        this._initialState = initialState;
    }

    /**
     * Returns the state with which the FSM was initialized.
     */
    get initialState(): T {
        return this._initialState;
    }

    /**
     * Returns the current state.
     */
    get currentState(): T {
        return this._currentState;
    }

    /**
     * Attempts to transition from the current state to the given state. If this transition is not allowed
     * per the config, then an error will be logged.
     */
    transitionTo(state: T, data?: Data): void;
    async transitionTo(state: T, data: Data) {
        if (this.canTransitionTo(state)) {
            // If the onTransitionStart callback is defined, invoke it. If it returns false,
            // then the transition will be cancelled.
            if (typeof this.config.onTransitionStart === 'function') {
                const canTransition = await awaitPromiseOrObservable(
                    this.config.onTransitionStart(this._currentState, state, data),
                );
                if (canTransition === false) {
                    return;
                } else if (typeof canTransition === 'string') {
                    await this.onError(this._currentState, state, canTransition);
                    return;
                }
            }
            const fromState = this._currentState;
            // All is well, so transition to the new state.
            this._currentState = state;
            // If the onTransitionEnd callback is defined, invoke it.
            if (typeof this.config.onTransitionEnd === 'function') {
                await awaitPromiseOrObservable(this.config.onTransitionEnd(fromState, state, data));
            }
        } else {
            return this.onError(this._currentState, state);
        }
    }

    /**
     * Jumps from the current state to the given state without regard to whether this transition is allowed or not.
     * None of the lifecycle callbacks will be invoked.
     */
    jumpTo(state: T) {
        this._currentState = state;
    }

    /**
     * Returns an array of state to which the machine may transition from the current state.
     */
    getNextStates(): ReadonlyArray<T> {
        return this.config.transitions[this._currentState].to;
    }

    /**
     * Returns true if the machine can transition from its current state to the given state.
     */
    canTransitionTo(state: T): boolean {
        return -1 < this.config.transitions[this._currentState].to.indexOf(state);
    }

    private async onError(fromState: T, toState: T, message?: string) {
        if (typeof this.config.onError === 'function') {
            await awaitPromiseOrObservable(this.config.onError(fromState, toState, message));
        }
    }
}
