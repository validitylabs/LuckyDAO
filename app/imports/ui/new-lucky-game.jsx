import {Meteor} from "meteor/meteor";
import TrackerReact from "meteor/ultimatejs:tracker-react";
import React, {PureComponent} from "react";
import QRCode from "qrcode.react";
import Panel from "react-bootstrap/lib/Panel";
import Button from "react-bootstrap/lib/Button";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import Grid from "react-bootstrap/lib/Grid";
import Row from "react-bootstrap/lib/Row";
import Tooltip from "react-bootstrap/lib/Tooltip";
import OverlayTrigger from "react-bootstrap/lib/OverlayTrigger";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import DatePicker from "react-bootstrap-date-picker";
import TimePicker from "react-bootstrap-time-picker";
import {Globals} from "../model/globals";
import {Games} from "../model/games";
import {ether, getWeb3} from "../ethereum/ethereum-services";

export default class LuckyGame extends TrackerReact(PureComponent) {
    constructor(props) {
        super(props);
        this.state = {
            endDate: new Date().toISOString(),
            endTime: 36000
        };
        let self = this;
        Meteor.callPromise("server-eth-address").then((address) => self.setState({address: address}));
        this.qrTooltip = (
            <Tooltip id="tooltip">Click the QR code to refresh the balance</Tooltip>
        );
        this._handleDateChange = this._handleDateChange.bind(this);
        this._handleTimeChange = this._handleTimeChange.bind(this);
        this._newGame = this._newGame.bind(this);
    }

    _refreshBalance() {
        console.log("refreshing balance");
        Meteor.call("refresh-app-balance");
    }

    _handleDateChange(value, formattedValue) {
        this.setState({
            endDate: value, // ISO String, ex: "2016-11-19T12:00:00.000Z"
            formattedEndDate: formattedValue // Formatted String, ex: "11/19/2016"
        });
    }

    _handleTimeChange(value) {
        this.setState({
            endTime: value,
        });
    }

    _newGame() {
        Meteor.callPromise("create-new-game").then((txReceipt) => {
            console.log(txReceipt);
        })
    }

    render() {
        const lastGame = Games.findOne({}, {sort: {endTimestamp: -1}});
        const isHidden = Meteor.user().profile.isAdmin && (!lastGame || lastGame.endTimestamp < new Date().getTime()) ? "" : "hidden";
        const appAccount = Globals.findOne({name: "appAccount"}) || {};
        const canCreate = appAccount.balance > 5000000000000;

        return (
            <Panel className={isHidden}>
                <h1>Create a new game</h1>
                <Grid>
                    <Row>
                        <Col onClick={this._refreshBalance} sm={4}>
                            <OverlayTrigger placement="right" overlay={this.qrTooltip}>
                                <QRCode size={256} value={"IBAN:" + getWeb3().eth.iban.fromAddress(appAccount.address)}/>
                            </OverlayTrigger>
                        </Col>
                        <Col sm={8}>
                            <p>As the administrator you enjoy the privilege of creating new games.</p>
                            <p>the address {appAccount.address} has {appAccount.balance / ether} ETH for transactions</p>
                        </Col>
                    </Row>
                </Grid>
                <Form horizontal>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            End Date
                        </Col>
                        <Col sm={2}>
                            <DatePicker id="endDate" value={this.state.endDate}
                                        dateFormat="DD-MM-YYYY"
                                        onChange={this._handleDateChange}/>
                        </Col>
                        <Col componentClass={ControlLabel} sm={2}>
                            End Time
                        </Col>
                        <Col sm={2}>
                            <TimePicker start="08:00" end="20:00" step={30} value={this.state.endTime} onChange={this._handleTimeChange} />
                        </Col>
                        <Col sm={4}>
                            <Button bsStyle="primary" disabled={!canCreate} onClick={this._newGame}>
                                Create a new Game
                            </Button>
                        </Col>
                    </FormGroup>

                </Form>

            </Panel>
        )
    }
}
