import { useSignal } from '@preact/signals-react'
import { useEffect } from 'react'
import { calculateYAxisValues } from '../utils'
import ToolTip from './ToolTip'

export default function LineChart({ id, xKey, yKeys, data, keyNames, useSameYAxisValues }) {
    const chartStyleValues = useSignal(null)

    const lineChartStyleHandler = () => {
        let leftSideValues = []
        for (let i in yKeys) { leftSideValues.push(calculateYAxisValues(data, yKeys[i], 0)) }

        if (useSameYAxisValues) {
            const sortedLeftSideValues = leftSideValues.slice().flat().sort((a, b) => b - a)
            const lowestLeftSideValue = sortedLeftSideValues[sortedLeftSideValues.length - 1]
            const highestLeftSideValue = sortedLeftSideValues[0]

            leftSideValues.map(item => {
                item[0] = highestLeftSideValue
                item[item.length - 1] = lowestLeftSideValue
            })
        }

        const chartWidth = +document.getElementById(id).getBoundingClientRect().width.toFixed(2)
        const chartHeight = +document.getElementById(id).getBoundingClientRect().height.toFixed(2)

        let _chartStyle = []

        for (let i in yKeys) {
            _chartStyle.push([])
            let leftSideHighestValue = leftSideValues[i][0]
            let leftSideLowestValue = leftSideValues[i][leftSideValues[i].length - 1]

            for (let j in data) {
                _chartStyle[i].push([((data[j][yKeys[i]] - leftSideLowestValue) / (leftSideHighestValue - leftSideLowestValue)) * 100])

                if (j > 0) {
                    let verticalSideLength = chartHeight * ((_chartStyle[i][j - 1][0] - _chartStyle[i][j][0]) * 0.01)
                    let horizontalSideLength = chartWidth / data.length
                    let hipotenus = Math.sqrt((verticalSideLength ** 2) + (horizontalSideLength ** 2))

                    _chartStyle[i][j - 1][1] = hipotenus
                    _chartStyle[i][j - 1][2] = Math.asin(verticalSideLength / hipotenus) * (180 / Math.PI) // degree
                }
            }
        }

        chartStyleValues.value = _chartStyle
    }

    useEffect(() => {
        lineChartStyleHandler()

        window.addEventListener('resize', lineChartStyleHandler)
        return () => window.removeEventListener('resize', lineChartStyleHandler)
    }, [data])

    return (
        <div className="line-chart">
            <div className="chart-header">
                <span>{id.replaceAll('-', '   ')}</span>
                <div className="color-informations">
                    {yKeys.map((yKey, yKeyIndex) =>
                        <div key={yKeyIndex}>
                            <span className={'color ' + `color${yKeyIndex + 1}`} />
                            <span className="y-key-name">{keyNames[yKey] || yKey}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="chart-body">
                <div id={id} className="chart">
                    {(chartStyleValues.value?.length > 0 && chartStyleValues.value[0].length == data.length) && [...new Array(data.length)].map((_, columnIndex) =>
                        <div className="column" key={columnIndex}>
                            {[...new Array(chartStyleValues.value.length)].map((_, yKeyIndex) => {
                                let styleItem = chartStyleValues.value[yKeyIndex][columnIndex]

                                return <div className="column-inner" style={{ height: styleItem[0] + '%' }} key={yKeyIndex}>
                                    <span className={`dot color${yKeyIndex + 1}`} />
                                    <span className={`line color${yKeyIndex + 1}`} style={{ width: styleItem[1] + 'px', transform: `rotate(${styleItem[2]}deg) translateY(50%)` }} />
                                </div>
                            })}
                            <div className="column-dashed-line" />
                            <ToolTip content={data[columnIndex].slice(0, keyNames.length).map((item, index) => [keyNames[index], item])} joinString=": " />
                        </div>
                    )}

                    {['vertical', 'horizontal'].map((item, index) =>
                        <div className={`${item}-back-lines`} key={index}>
                            {[...new Array(7)].map((_, lineIndex) => <span key={lineIndex} />)}
                        </div>
                    )}
                </div>

            </div>

            <div className="chart-footer">
                <span>{data[0][xKey]}</span>
                {data.length > 1 && <span>{data[data.length - 1][xKey]}</span>}
            </div>
        </div>
    )
}

// <LineChart id="investment-valuation-history-chart" xKey={0} yKeys={[1, 2]} data={[...user.value.investmentValuationHistory]} keyNames={{ 0: 'Date', 1: 'cost', 2: 'value' }} />