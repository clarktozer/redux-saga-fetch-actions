import { call, put, takeEvery } from "redux-saga/effects";

export interface IFetchPayload<T, E> {
    request: () => Promise<T>;
    onSuccess?: (response: T) => void;
    onFailure?: (error: E) => void;
}

export interface IFetchAction<T, M, E = Error> {
    type: string;
    payload: IFetchPayload<T, E>;
    meta?: M;
}

function* fetchWorker<T, M>(actionPrefix: string, { type, payload: { onFailure, onSuccess, request }, meta }: IFetchAction<T, M>) {
    const prefix = type.replace(actionPrefix, "");

    try {
        yield put({
            type: `${prefix}_REQUEST`
        });

        const response = yield call(request);

        yield put({
            type: `${prefix}_SUCCESS`,
            payload: response,
            meta: meta || request
        });

        if (onSuccess) {
            yield call(onSuccess, response);
        }
    } catch (error) {
        yield put({
            type: `${prefix}_FAILED`,
            payload: error,
            meta: meta || request,
            error: true
        });

        if (onFailure) {
            yield call(onFailure, error);
        }
    }
}

export function* fetchSaga<T, M>(actionPrefix = "FETCH_") {
    yield takeEvery(
        ({ payload, type }: IFetchAction<T, M>) => type && type.startsWith(actionPrefix) && payload.request != null,
        function*(action: IFetchAction<T, M>) {
            yield call(fetchWorker, actionPrefix, action);
        }
    );
}
