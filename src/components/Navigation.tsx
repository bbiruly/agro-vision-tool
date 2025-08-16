import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  BarChart3, 
  Leaf, 
  Settings, 
  Menu, 
  Home,
  Droplets,
  AlertTriangle 
} from "lucide-react"

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home
    },
    {
      name: "Fields",
      href: "/fields",
      icon: Leaf
    },
    {
      name: "Analytics",
      href: "/analytics", 
      icon: BarChart3
    },
    {
      name: "Fertilizer",
      href: "/fertilizer",
      icon: Droplets
    },
    {
      name: "Alerts",
      href: "/alerts",
      icon: AlertTriangle
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings
    }
  ]

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={cn("space-y-2", mobile && "pt-4")}>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.href
        
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => mobile && setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-primary text-primary-foreground shadow-soft" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 bg-card border-r shadow-soft overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold text-primary">AgriTech</span>
          </div>
          <div className="mt-8 flex-grow flex flex-col px-4">
            <NavContent />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b shadow-soft">
          <div className="flex items-center">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="ml-2 text-lg font-bold text-primary">AgriTech</span>
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex items-center mb-6">
                <Leaf className="h-6 w-6 text-primary" />
                <span className="ml-2 text-lg font-bold text-primary">AgriTech</span>
              </div>
              <NavContent mobile />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}

export default Navigation