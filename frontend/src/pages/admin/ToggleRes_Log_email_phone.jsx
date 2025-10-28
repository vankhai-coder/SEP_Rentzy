import RegisterWithPhoneNumber from '../auth/RegisterWithPhoneNumber'
import LoginWithPhoneNumber from '../auth/LoginWithPhoneNumber'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Register from '../../../pages/renter/auth/Register.jsx'
import Login from '../../../pages/renter/auth/Login.jsx'
import React from 'react'

const Home = () => {

  // state for login and register with phone Dialog :
  const [isLoginWithPhoneOpen, setIsLoginWithPhoneOpen] = React.useState(false)
  const [isRegisterWithPhoneOpen, setIsRegisterWithPhoneOpen] = React.useState(false)
  // state for login and register with email Dialog :
  const [loginOpen, setLoginOpen] = React.useState(false)
  const [registerOpen, setRegisterOpen] = React.useState(false)

  return (
    <div>

      {/* Login with Phone */}
      <Dialog open={isLoginWithPhoneOpen} onOpenChange={setIsLoginWithPhoneOpen} >
        <DialogTrigger asChild>
          <Button
            className={"p-6 border border-black"}
            variant={"outline"}

          >
            Đăng nhập với số điện thoại
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle></DialogTitle>
            <DialogDescription>
              <LoginWithPhoneNumber setIsRegisterWithPhoneOpen={setIsRegisterWithPhoneOpen} setIsLoginWithPhoneOpen={setIsLoginWithPhoneOpen} setLoginOpen={setLoginOpen} />
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Register with Phone */}
      <Dialog open={isRegisterWithPhoneOpen} onOpenChange={setIsRegisterWithPhoneOpen} >
        <DialogTrigger asChild>
          <Button
            className={"p-6 border border-black"}
            variant={"outline"}

          >
            Đăng ký với số điện thoại
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle></DialogTitle>
            <DialogDescription>
              <RegisterWithPhoneNumber setRegisterOpen={setRegisterOpen} setIsRegisterWithPhoneOpen={setIsRegisterWithPhoneOpen} setIsLoginWithPhoneOpen={setIsLoginWithPhoneOpen} />
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Register with email button: */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen} >
        <DialogTrigger>
          <a
            className={"p-6"}
          >
            Đăng Ký
          </a>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle></DialogTitle>
            <DialogDescription>
              <Register setRegisterOpen={setRegisterOpen} setLoginOpen={setLoginOpen} setIsRegisterWithPhoneOpen={setIsRegisterWithPhoneOpen} />
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Login with email Button */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen} >
        <DialogTrigger asChild>
          <Button
            className={"p-6 border border-black"}
            variant={"outline"}

          >
            Đăng Nhập
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle></DialogTitle>
            <DialogDescription>
              <Login setRegisterOpen={setRegisterOpen} setLoginOpen={setLoginOpen} setIsLoginWithPhoneOpen={setIsLoginWithPhoneOpen} />
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default Home