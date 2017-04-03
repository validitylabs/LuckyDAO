import TrackerReact from "meteor/ultimatejs:tracker-react";
import React, {PureComponent} from "react";
import QRCode from "qrcode.react";
import Grid from "react-bootstrap/lib/Grid";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import {Games} from "../model/games";

export default class LuckyGame extends TrackerReact(PureComponent) {
    constructor(props) {
        super(props);
        this.state = {
            isHidden: true,
        };
    }

    render() {
        const lastGame = Games.findOne({}, {sort: {endTimestamp: -1}});
        const isHidden = !lastGame || lastGame.endTimestamp > new Date().getTime() ? "hidden" : "";
        return (
            <Grid className={isHidden}>
                <Row className="show-grid">
                    <Col xs={12} md={8}>
                        <QRCode value="titi tata"/>
                    </Col>
                    <Col xs={6} md={4}><code>&lt;{'Col xs={6} md={4}'} /&gt;</code></Col>
                </Row>
            </Grid>
        );
    }
}
