import { useComputed, useSignal } from '@preact/signals-react'
import { calculateYAxisValues } from '../utils'
import ToolTip from './ToolTip'

export default function ColumnChart({ title, data, xKey, yKeys }) {
    const yAxisValues = useComputed(() => {
        let values = []
        for (let i in yKeys) { values.push(calculateYAxisValues(data.value, yKeys[i], 3)) }
        return values
    })

    const toolTipValue = useSignal(-1)
    const ToolTipWrapper = () => {
        return (
            <>
                {toolTipValue.value != -1 && <ToolTip content={Object.entries(data.value[toolTipValue.value])} joinString=": "/>}
            </>
        )
    }

    return (
        <div className="column-chart">
            <div className="chart-header">
                <h4>{title}</h4>
                <div className="color-info-box">
                    {yKeys.map((yKey, yKeyIndex) =>
                        <div key={yKeyIndex}>
                            <span className="color" />
                            <span className="y-key-name">{yKey}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="chart-body">
                {data.value.map((dataItem, dataItemIndex) =>
                    <div className="chart-body-item" onMouseOver={() => toolTipValue.value = dataItemIndex} onMouseLeave={() => toolTipValue.value = -1} key={dataItemIndex}>
                        {yKeys.map((yKey, yKeyIndex) =>
                            <div className="column" style={{ height: `${(dataItem[yKey] / yAxisValues.value[yKeyIndex][0]) * 100}%` }} key={yKeyIndex} />
                        )}
                        <ToolTipWrapper />
                    </div>
                )}
            </div>
        </div>
    )
}

// <ColumnChart title="Capsules Period Market Data" data={capsulesData} xKey={null} yKeys={['price', 'volume']} />