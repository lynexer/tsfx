'use client';

import { type Context, useContext } from 'react';
import { NuiVisibilityContext, type NuiVisibilityContextValue } from '../contexts';

export const useNuiVisibility = () =>
    useContext<NuiVisibilityContextValue>(
        NuiVisibilityContext as Context<NuiVisibilityContextValue>
    );
