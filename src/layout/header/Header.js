import { useState } from "react";

import Modal from "../../components/modal/Modal";
import LoginForm from "../../features/auth/loginForm/LoginForm";
import SignupForm from "../../features/auth/signupForm/SignupForm";

import Logo from "./Logo";
import TextButton from "./TextButton";
import Button from "../../components/button/Button";
import ProfileDropdown from "../../components/profileDropdown/ProfileDropdown";
import ForgotPasswordForm from "../../features/auth/forgotPassword/ForgotPasswordForm";

function Header() {
  const [modalLoginIsOpen, setModalLoginIsOpen] = useState(false);
  const [modalSignupIsOpen, setModalSignupIsOpen] = useState(false);
  const [modalForgotIsOpen, setModalForgotIsOpen] = useState(false);

  const openModalLogin = () => setModalLoginIsOpen(true);
  const closeModalLogin = () => setModalLoginIsOpen(false);

  const openModalSignup = () => setModalSignupIsOpen(true);
  const closeModalSignup = () => setModalSignupIsOpen(false);

  const openModalForgot = () => setModalForgotIsOpen(true);
  const closeModalForgot = () => setModalForgotIsOpen(false);

  const switchToModalSignup = () => {
    closeModalLogin();
    openModalSignup();
  };

  const switchToModalLogin = () => {
    closeModalSignup();
    openModalLogin();
  };

  const switchToModalForgot = () => {
    closeModalLogin();
    openModalForgot();
  };

  return (
    <div className="nav col-8">
      <div className="nav-container">
        <Logo />
        <div className="text-button-group">
          <TextButton name="Home" to="/" />
          <TextButton name="Find a camp" to="/findacamp" />
          <TextButton name="Blog" to="/blog" />
          <TextButton name="Join camp" to="/join" />
        </div>

        <div className="auth-button-group">
          <Button name="Login" className="btn-auth-login mx-5 h-40-px" onClick={openModalLogin} />
          <Button name="Signup" className="btn-auth-signup mx-5 h-40-px" onClick={openModalSignup} />
          <ProfileDropdown />
        </div>
      </div>
      <div className="text-button-outside-group">
        <TextButton name="Home" to="/" />
        <TextButton name="Find a camp" to="/findacamp" />
        <TextButton name="Blog" to="blog" />
        <TextButton name="Join camp" to="join" />
      </div>
      <Modal header="Login" isOpen={modalLoginIsOpen} closeModal={closeModalLogin}>
        <LoginForm switchToModalSignup={switchToModalSignup} switchToModalForgot={switchToModalForgot} />
      </Modal>
      <Modal header="Signup" isOpen={modalSignupIsOpen} closeModal={closeModalSignup}>
        <SignupForm switchToModalLogin={switchToModalLogin} />
      </Modal>
      <Modal header="Forgot password" isOpen={modalForgotIsOpen} closeModal={closeModalForgot}>
        <ForgotPasswordForm />
      </Modal>
    </div>
  );
}

export default Header;
