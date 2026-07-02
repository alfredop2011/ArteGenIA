import { redirect } from "next/navigation";

/**
 * Redirect de rescate — mismo caso que /login. Si un user escribe
 * /signup a mano, lo llevamos a home con ?auth=signup para que el
 * AuthModal abra en modo registro.
 */
export default function SignupRedirect() {
    redirect("/?auth=signup");
}
