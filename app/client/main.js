import {Meteor} from "meteor/meteor";
import {render} from "react-dom";
import {renderRoutes} from "../imports/ui/router";
import React from "react";
import Jumbotron from "react-bootstrap/lib/Jumbotron";

Meteor.startup(() => {
    Meteor.subscribe("globals", function (err) {
        if (err){
            const jumbotronInstance = (
                <Jumbotron>
                    <h1>Hello, world!</h1>
                    <p>This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.</p>
                </Jumbotron>
            );
            render(jumbotronInstance,
                document.getElementById('render-target'));
        }else
            Meteor.subscribe("game-list", function (err) {
                render(renderRoutes(),
                    document.getElementById('render-target'));
            })
    })
})