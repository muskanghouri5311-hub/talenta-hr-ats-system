import LoginForm from './LoginForm'

const LoginPage = () => {
    return (
        <div className='flex flex-row lg:flex-row min-h-screen overflow-hidden'>
            <aside className="flex min-h-screen w-full flex-col bg-black text-white font-sm p-6 sm:p-10 lg:h-screen lg:w-1/2 lg:p-20">

                <div className="mt-1 flex items-center gap-2 lg:mt-4">
                    <div className="flex h-2 w-2 items-center ml-2 justify-center rounded-2xl bg-indigo-700 text-lg font-semibold text-white sm:h-12 sm:w-12 sm:text-2xl lg:mt-45">
                        T
                    </div>

                    <div className="pl-1 font-semibold text-white sm:text-3xl lg:mt-45">
                        Talenta
                    </div>
                </div>

                <div className="mt-4  text-left text-1xl font-bold leading-tight [word-spacing:5px] text-white sm:ml-6 sm:text-4xl lg:text-3xl">
                    One login. Every role <br />
                    sees exactly what they<br />
                    need.
                </div>

                <div className="mt-4  text-left text-base text-gray-300 sm:ml-6 sm:text-lg lg:text-sm">
                    Super Admins configure the system, recruiters run<br />
                    hiring, interviewers focus on feedback - all from<br />
                    role-based permissions.
                </div>

            </aside>
            <LoginForm />
        </div>
    )
}

export default LoginPage;

