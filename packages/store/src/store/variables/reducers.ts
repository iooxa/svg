import {
  VariablesState,
  VariablesActionTypes,
  DEFINE_VARIABLE, REMOVE_VARIABLE,
  UPDATE_VARIABLE_VALUE,
} from './types';
import { RETURN_RESULTS } from '../comms/types';
import { includeCurrentValue, testScopeAndName, unpackCurrent } from './utils';

const initialState: VariablesState = {};


const variablesReducer = (
  state: VariablesState = initialState,
  action: VariablesActionTypes,
): VariablesState => {
  switch (action.type) {
    case DEFINE_VARIABLE: {
      const variable = action.payload;
      const { scope, name } = variable;
      if (!testScopeAndName(scope, name)) throw new Error('Scope or name has bad characters');
      const newState = {
        ...state,
        [variable.id]: includeCurrentValue(variable, variable.type),
      };
      return newState;
    }
    case REMOVE_VARIABLE: {
      const { id } = action.payload;
      const newState = {
        ...state,
      };
      delete newState[id];
      return newState;
    }
    case UPDATE_VARIABLE_VALUE: {
      const { id, value } = action.payload;
      const variable = state[id];
      if (variable == null) throw new Error('No variable.');
      if (variable.derived) throw new Error('Cannot update a derived variable.');
      return {
        ...state,
        [id]: includeCurrentValue(variable, variable.type, value),
      };
    }
    case RETURN_RESULTS: {
      const newState = {
        ...state,
      };
      Object.entries(action.payload.results.variables).forEach(([id, value]) => {
        newState[id] = unpackCurrent(newState[id], value);
      });
      return newState;
    }
    default:
      return state;
  }
};

export default variablesReducer;