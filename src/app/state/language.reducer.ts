import { createReducer, on } from '@ngrx/store';
import { changeLanguage } from './language.actions';

export const initialState = 'en'; // default language

export const languageReducer = createReducer(
  initialState,
  on(changeLanguage, (state, { language }) => language)
);
