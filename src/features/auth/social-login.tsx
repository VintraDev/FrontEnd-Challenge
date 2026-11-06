import { Button } from '@/components/ui/button';

export function SocialLogin() {
  return (
    <div className="login-social">
      <p>Ou continue com</p>
      <Button variant="outline" disabled>
        <img src="/assets/icons/google.png" alt="" aria-hidden="true" />
        Continuar com Google
      </Button>
      <Button variant="outline" disabled>
        <img src="/assets/icons/facebook.png" alt="" aria-hidden="true" />
        Continuar com Facebook
      </Button>
      <span>Login social em breve</span>
    </div>
  );
}
