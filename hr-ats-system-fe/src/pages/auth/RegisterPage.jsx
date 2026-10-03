import Register from './Register'

const RegisterPage = () => {
  return (
     <div className='flex flex-row lg:flex-row min-h-screen overflow-hidden'>
            <aside className="flex min-h-screen w-full flex-col bg-black text-white font-sm p-6 sm:p-10 lg:h-screen lg:w-1/2 lg:p-20">

                <div className="mt-2 flex items-center gap-3 lg:mt-16">
                    <div className="flex h-10 w-10 items-center ml-6 justify-center rounded-2xl bg-indigo-700 text-xl font-bold text-white sm:h-12 sm:w-12 sm:text-2xl lg:mt-45">
                        T
                    </div>

                    <div className="pl-2 text-2xl font-bold text-white sm:text-3xl lg:mt-45">
                        Talenta
                    </div>
                </div>

                <div className="mt-8 ml-2 text-left text-3xl font-extrabold leading-tight text-white sm:ml-6 sm:text-4xl lg:text-5xl">
                    One login. Every role <br />
                    sees exactly what they<br />
                    need.
                </div>

                <div className="mt-8 ml-2 text-left text-base text-gray-300 sm:ml-6 sm:text-lg lg:text-xl">
                    Super Admins configure the system, recruiters run<br />
                    hiring, interviewers focus on feedback - all from<br />
                    role-based permissions.
                </div>

            </aside>
            <Register />
        </div>
  )
}

export default RegisterPage
