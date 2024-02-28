import { useSignal } from "@preact/signals-react"

export default function DoubleValueColumnChart({ data, title, valueKeys, toolTipKeys }) {
    const chartData = useSignal(false) // array

    const chartHandler = () => {
        let firstValueTopPoint = data.map(item => { return item[valueKeys[0]] }).slice().sort((a, b) => b - a)[0] * 1.25
        let secondValueTopPoint = data.map(item => { return item[valueKeys[1]] }).slice().sort((a, b) => b - a)[0] * 1.25

        chartData.value = { firstValueTopPoint, secondValueTopPoint }
    }
    chartHandler()

    return (
        <div className="double-value-column-chart">
            <div className="chart-header">{title}</div>
            <div className="chart-body">
                {data.map((item, index) =>
                    <div key={index} style={{ width: (100 / data.length) + '%' }} className="value-wrapper">
                        <div className="value value1" style={{ width: '50%', height: ((item[valueKeys[0]] / chartData.value.firstValueTopPoint) * 100) + '%' }} />
                        <div className="value value2" style={{ width: '50%', height: ((item[valueKeys[1]] / chartData.value.secondValueTopPoint) * 100) + '%' }} />
                        <div className="tool-tip">
                            {toolTipKeys.map((toolTipKey, toolTipIndex) =>
                                <span className="tool-tip-item" key={toolTipIndex}>
                                    <span>{toolTipKey.includes('-') ? toolTipKey.replaceAll('-', ' ') : toolTipKey}</span>
                                    <span>{item[toolTipKey]}</span>
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}