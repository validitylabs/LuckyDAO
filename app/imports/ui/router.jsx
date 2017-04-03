import React from "react";
import {browserHistory, Route, Router} from "react-router";
// route components
import MainWindow from "./main-window";
import AdminPage from "./main-window";
import LuckyGame from "./main-window";

export const renderRoutes = () => (
    <Router history={browserHistory}>
        <Route path="/" component={MainWindow}>
            <Route path="admin" component={AdminPage}/>
            <Route path="*" component={LuckyGame}/>
        </Route>

    </Router>
);