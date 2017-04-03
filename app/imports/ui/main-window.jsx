import {Meteor} from "meteor/meteor";
import TrackerReact from "meteor/ultimatejs:tracker-react";
import React, {PureComponent} from "react";
import Navbar from "react-bootstrap/lib/Navbar";
import Nav from "react-bootstrap/lib/Nav";
import NavDropdown from "react-bootstrap/lib/NavDropdown";
import NavItem from "react-bootstrap/lib/NavItem";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import FormControl from "react-bootstrap/lib/FormControl";
import Col from "react-bootstrap/lib/Col";
import Button from "react-bootstrap/lib/Button";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import Modal from "react-bootstrap/lib/Modal";
import Game from "./lucky-game";
import NewGame from "./new-lucky-game";

export default class MainWindow extends TrackerReact(PureComponent) {
    constructor(props) {
        super(props);
        this.state = {
            register: false,
            validation: {
                email: null
            }
        };
        this._toggleRegistration = this._toggleRegistration.bind(this);
        this._loginOrRegister = this._loginOrRegister.bind(this);
        this._handleChange = this._handleChange.bind(this);
    }

    _toggleRegistration() {
        let emailValidation = null;
        if(this.state.validation.email)
            this.state.validation.email == "success" ? "error" : "success";

        this.setState({register: !this.state.register, validation: {email: emailValidation}});
    }

    _loginOrRegister() {
        if(this.state.register) {
            let options = {
                username: this.state.email,
                email: this.state.email,
                password: this.state.password,
                profile: {
                    fullName: this.state.fullName,
                }
            };
            Accounts.createUser(options, (err) => {
                if(err){
                    console.log(err);
                } else {
                    Meteor.call("set-admin");
                }
            });
        }
    }

    _handleChange(event) {
        let value = event.target.value;
        let self = this;
        if(event.target.id == "email" && value.indexOf("@") > 0 && value.indexOf(".") > value.indexOf("@")) {
            Meteor.callPromise("verify-email", value).then(function (exists) {
                let validation = self.state.validation;
                if(self.state.register != exists)
                    validation.email = "success";
                if(self.state.register == exists)
                    validation.email = "error";

                self.setState({validation})
            })
        }
        let change = {};
        change[event.target.id] = value;
        this.setState(change);
    };

    render() {
        let userButton = undefined;

        if (this.state.user) {
            userButton = <NavItem eventKey={1}>this.state.user.fullName</NavItem>
        } else {
            const formInstance = (
                <NavItem eventKey={1} style={{width: 400}} onClick={(evt) => evt.preventDefault()}>
                    Login
                </NavItem>
            );
            userButton = <NavDropdown eventKey={1} title="Dropdown" id="basic-nav-dropdown">
                {formInstance}
            </NavDropdown>

        }
        const navbarInstance = (
            <Navbar collapseOnSelect>
                <Navbar.Header>
                    <Navbar.Brand>
                        <a href="#">Lucky DAO</a>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav>
                        <NavItem eventKey={1} href="#">Link</NavItem>
                        <NavItem eventKey={2} href="#">Link</NavItem>
                    </Nav>
                    <Nav pullRight>
                        {userButton}
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );

        return (<div>
                {navbarInstance}
                <Modal show={!Meteor.userId()}>
                        <Modal.Header>
                            <Modal.Title>Login</Modal.Title>
                        </Modal.Header>

                        <Modal.Body>
                            <Form horizontal>
                                <FormGroup validationState={this.state.validation.email}>
                                    <Col componentClass={ControlLabel} sm={4}>
                                        Email
                                    </Col>
                                    <Col sm={8}>
                                        <FormControl id="email" type="email" placeholder="Email" onChange={this._handleChange}/>
                                        <FormControl.Feedback />
                                    </Col>
                                </FormGroup>

                                <FormGroup>
                                    <Col componentClass={ControlLabel} sm={4}>
                                        Password
                                    </Col>
                                    <Col sm={8}>
                                        <FormControl id="password" type="password" placeholder="Password" onChange={this._handleChange}/>
                                    </Col>
                                </FormGroup>
                                <div className={this.state.register ? "" : "hidden"}>
                                    <FormGroup>
                                        <Col componentClass={ControlLabel} sm={4}>
                                            Full Name
                                        </Col>
                                        <Col sm={8}>
                                            <FormControl id="fullName" type="text" placeholder="Full Name" onChange={this._handleChange}/>
                                        </Col>
                                    </FormGroup>
                                </div>
                            </Form>
                        </Modal.Body>

                        <Modal.Footer>
                            <Button bsStyle="primary" onClick={this._loginOrRegister}>
                                {this.state.register ? "Register" : "Login"}
                                </Button>
                            <Button bsStyle="default" onClick={this._toggleRegistration}>
                                {this.state.register ? "Cancel" : "Register"}
                            </Button>
                        </Modal.Footer>

                </Modal>
                <Game/>
                <NewGame/>
            </div>
        );
    }
}
