import { useCustomProperties } from '@airtable/blocks/interface/ui';
import './styles.css';
import { getCustomProperties } from './index';
import { WorkbenchLoaded } from './WorkbenchLoaded';
import { colors, fonts, microLabel, space } from './utils/theme';

export function App() {
    const { customPropertyValueByKey, errorState } = useCustomProperties(getCustomProperties);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agentsTable = customPropertyValueByKey.agentsTable as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemsTable = customPropertyValueByKey.itemsTable as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const changeLogTable = customPropertyValueByKey.changeLogTable as any;

    if (errorState) {
        return (
            <div className="clive-root" style={{ minHeight: '100%', padding: space(6), fontFamily: fonts.mono, color: colors.danger }}>
                <span style={microLabel}>config error</span>
                <p style={{ marginTop: space(2) }}>{errorState.error.message}</p>
            </div>
        );
    }

    if (!agentsTable || !itemsTable || !changeLogTable) {
        return (
            <div className="clive-root" style={{ minHeight: '100%', padding: space(6), fontFamily: fonts.mono, color: colors.textMuted }}>
                <span style={microLabel}>awaiting source</span>
                <p style={{ marginTop: space(2) }}>
                    Select Agent Environments, Context Items, and Change Log tables in this extension&apos;s settings.
                </p>
            </div>
        );
    }

    return (
        <WorkbenchLoaded
            agentsTable={agentsTable}
            itemsTable={itemsTable}
            changeLogTable={changeLogTable}
        />
    );
}
