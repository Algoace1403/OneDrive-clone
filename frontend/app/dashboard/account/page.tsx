'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/lib/hooks/use-toast'
import {
  User,
  Mail,
  HardDrive,
  Camera,
  Lock,
  LogOut,
  Trash2,
  Download,
  Shield
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function AccountPage() {
  const { user, logout, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [isLoading, setIsLoading] = useState(false)

  if (!user) return null

  const storagePercentage = (user.storageUsed / user.storageLimit) * 100
  const storageUsedGB = (user.storageUsed / 1024 / 1024 / 1024).toFixed(2)
  const storageLimitGB = (user.storageLimit / 1024 / 1024 / 1024).toFixed(0)

  const handleUpdateProfile = async () => {
    setIsLoading(true)
    try {
      await updateProfile({ name })
      setIsEditing(false)
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // TODO: Implement profile picture upload
    toast({
      title: "Feature coming soon",
      description: "Profile picture upload will be available soon",
    })
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>

      {/* Profile Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Manage your account details and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback className="text-2xl">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profile-picture"
                className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90"
              >
                <Camera className="h-4 w-4 text-primary-foreground" />
                <input
                  id="profile-picture"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                />
              </label>
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                Member since {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Display Name
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button
                      size="sm"
                      onClick={handleUpdateProfile}
                      disabled={isLoading}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setName(user.name)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{user.name}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
          <CardDescription>
            Track your storage consumption and limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              <span className="font-medium">Storage Used</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {storageUsedGB} GB of {storageLimitGB} GB
            </span>
          </div>
          <Progress value={storagePercentage} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {storagePercentage.toFixed(1)}% of your storage is used
          </p>
          {storagePercentage > 80 && (
            <p className="text-sm text-amber-600">
              ⚠️ You're running low on storage. Consider upgrading your plan.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            <Lock className="mr-2 h-4 w-4" />
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Shield className="mr-2 h-4 w-4" />
            Two-Factor Authentication
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Download className="mr-2 h-4 w-4" />
            Download My Data
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will need to sign in again to access your files.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={logout}>Sign Out</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full justify-start">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}