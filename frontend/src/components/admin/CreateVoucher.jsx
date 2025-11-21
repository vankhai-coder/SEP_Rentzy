import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { UserPlus } from 'lucide-react'


const CreateVoucher = () => {

  


  return (
    <div>

      <Dialog>
        <DialogTrigger asChild>
          <button className="inline-flex items-center gap-2 justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 px-4 py-2 text-base">
            <UserPlus />
            <span className="hidden sm:block"> Tạo voucher mới</span>
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo voucher mới</DialogTitle>
            <DialogDescription>
              {/*  */}

            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CreateVoucher