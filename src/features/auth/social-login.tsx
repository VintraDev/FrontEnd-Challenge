import { Button } from '@/components/ui/button';

const socialButtonClass =
  'gap-2 max-[700px]:min-h-11 max-[700px]:disabled:border-border max-[700px]:disabled:bg-transparent max-[700px]:disabled:text-muted-foreground';

export function SocialLogin() {
  return (
    <div className="mx-auto mt-6 grid max-w-[340px] gap-3 text-center max-[700px]:mt-10 max-[700px]:max-w-[358px]">
      <p className="text-sm text-muted-foreground max-[700px]:flex max-[700px]:items-center max-[700px]:gap-3 max-[700px]:text-foreground max-[700px]:before:h-px max-[700px]:before:flex-1 max-[700px]:before:bg-border max-[700px]:before:content-[''] max-[700px]:after:h-px max-[700px]:after:flex-1 max-[700px]:after:bg-border max-[700px]:after:content-['']">
        Ou continue com
      </p>
      <Button variant="outline" disabled className={socialButtonClass}>
        <img
          src="/assets/icons/google.png"
          alt=""
          aria-hidden="true"
          className="size-5 flex-none object-contain"
        />
        Continuar com Google
      </Button>
      <Button variant="outline" disabled className={socialButtonClass}>
        <img
          src="/assets/icons/facebook.png"
          alt=""
          aria-hidden="true"
          className="size-5 flex-none object-contain"
        />
        Continuar com Facebook
      </Button>
      <span className="text-xs text-muted-foreground">Login social em breve</span>
    </div>
  );
}
