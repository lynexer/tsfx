import React, { PropsWithChildren } from 'react';

export const NuiVisibilityExempt: React.FC<PropsWithChildren> = ({ children }) => {
    return <>{children}</>;
};

export const isVisibilityExempt = (child: React.ReactNode): boolean => {
    return (
        React.isValidElement(child) &&
        (child.type === NuiVisibilityExempt || (child.type as any)?.name === 'PersistentContent')
    );
};
