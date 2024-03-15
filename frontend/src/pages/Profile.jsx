import { useNavigate } from "react-router-dom";
import MessageBox from "../components/MessageBox"
import { dynamicTitle, usePostRequest } from "../utils";
import { batch, useSignal } from "@preact/signals-react";
import MultipleDataSetLineChart from "../components/MultipleDataSetLineChart";

export default function Profile({ user }) {
    const navigate = useNavigate()
    const postingData = useSignal(false)

    dynamicTitle(window.location.pathname.slice(1))

    const logout = () => {
        if (confirm('Are you sure you want log out')) {
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            user.value = false
            navigate('/')
        }
    }

    const changeInvestmentVisibility = async (value) => {
        postingData.value = true
        let post = await usePostRequest('/change-investment-visibility', { userId: user.value._id, value })
        if (post.success) {
            batch(() => {
                user.value = post.user
                postingData.value = false
            })
        }
        else alert(post.msg || 'Change investment visibiltiy failed')
    }

    return (
        <div className="profile-page container">
            {user.value ?
                <>
                    {user.value.investmentsValueHistory.length > 0 && <div className="line-chart-wrapper">
                        <MultipleDataSetLineChart data={[user.value.investmentsValueHistory.slice().map(item => { return { date: new Date(item.date).toLocaleDateString(navigator.language, { day: '2-digit', month: '2-digit', year: 'numeric' }), value: item.value } }),
                        user.value.investmentsValueHistory.slice().map(item => { return { date: new Date(item.date).toLocaleDateString(navigator.language, { day: '2-digit', month: '2-digit', year: 'numeric' }), value: item.cost } })]}
                            title={'Investments Value History Chart'} yKey={'value'} xKey={'date'} dataSliceOptions={[]} colors={['#4B69FF', '#883AAC']}
                            toolTipKeys={['value', 'cost']} />
                    </div>}
                    <section>
                        <div className="section-item">
                            <div className="section-item-header">
                                <i className="fa-solid fa-info" />
                                <span>Account Informations</span>
                            </div>
                            <div className="section-item-body">
                                <div>
                                    <span>Account Type</span>
                                    <span>{user.value.accountInformations.accountType}</span>
                                </div>
                                <hr />
                                <div>
                                    <span>Membership Date</span>
                                    <span>{user.value.accountInformations.membershipDate.slice(0, 10).split('-').reverse().join('.')}</span>
                                </div>
                                {user.value.accountInformations.lastInvestmentsMarketPriceUpdateDate && <>
                                    <hr />
                                    <div>
                                        <span>Last Investments Market Price Update Date</span>
                                        {new Date().getDate() != new Date(user.value.accountInformations.lastInvestmentsMarketPriceUpdateDate).getDate() ||
                                            ((new Date().getTime() - new Date(user.value.accountInformations.lastInvestmentsMarketPriceUpdateDate).getTime()) / (1000 * 60 * 60 * 24)) >= 1 ?
                                            <span>{new Date(user.value.accountInformations.lastInvestmentsMarketPriceUpdateDate)
                                                .toLocaleDateString(navigator.language, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                            :
                                            <span>{new Date(user.value.accountInformations.lastInvestmentsMarketPriceUpdateDate).toString().slice(16,21)}</span>
                                        }
                                        <span className="description-span">Investments market price updates every 30 minutes</span>
                                    </div>
                                </>}

                            </div>
                        </div>
                        <div className="section-item">
                            <div className="section-item-header">
                                <i className="fa-solid fa-gear" />
                                <span>Account Settings</span>
                            </div>
                            <div className="section-item-body">
                                <div>
                                    <span>Investment Visibility</span>
                                    <input name="investmentVisibilityCb" type="checkbox" defaultChecked={user.value.accountSettings.investmentVisibility} disabled={postingData.value}
                                        onChange={(e) => changeInvestmentVisibility(e.target.checked)} />
                                    <span className="description-span">If box is marked people can view your investments page</span>
                                </div>
                            </div>
                        </div>
                        <button className="btn log-out-btn" onClick={() => logout()}>
                            <i className="fa-solid fa-arrow-right-from-bracket" />
                            <span>Log out</span>
                        </button>
                    </section>
                </>
                :
                <MessageBox text='Need Login' />
            }
        </div>
    )
}
/*
<LineChart data={user.value.investmentsValueHistory.map(item => {
    return {
        cost: item.cost,
        value: +item.value.toFixed(2),
        date: new Date(item.date).toLocaleDateString().slice(0, 10).split('-').reverse().join('.')
    }
})}
    headerText='Investments Value History Chart' valueKey='value' horizontalAreaKey='date' toolTipKeys={['cost', 'value', 'date']} dataSliceOptions={[30, 60]} />
*/