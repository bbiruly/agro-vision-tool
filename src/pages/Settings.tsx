import Navigation from "@/components/Navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import SatelliteAPIConfiguration from "@/components/SatelliteAPIConfiguration"
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Smartphone,
  Mail,
  Globe,
  Users,
  Key,
  Download,
  Upload,
  Trash2,
  Save,
  Satellite
} from "lucide-react"

const Settings = () => {
  return (
    <div className="min-h-screen bg-gradient-earth">
      <Navigation />
      
      <div className="md:pl-64">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Manage your account, preferences, and system configuration</p>
            </div>
            <Button className="bg-gradient-primary text-primary-foreground hover:scale-105 shadow-medium hover:shadow-strong">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="satellite">Satellite APIs</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal and farm information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue="Farmer" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="john.farmer@example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="farmName">Farm Name</Label>
                    <Input id="farmName" defaultValue="Green Valley Farms" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Farm Location</Label>
                    <Input id="location" defaultValue="Iowa, United States" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Farm Description</Label>
                    <Textarea 
                      id="bio" 
                      defaultValue="Family-owned farm specializing in corn, wheat, and soybeans. Committed to sustainable farming practices."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select defaultValue="america/chicago">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="america/chicago">Central Time (UTC-6)</SelectItem>
                          <SelectItem value="america/new_york">Eastern Time (UTC-5)</SelectItem>
                          <SelectItem value="america/denver">Mountain Time (UTC-7)</SelectItem>
                          <SelectItem value="america/los_angeles">Pacific Time (UTC-8)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="units">Measurement Units</Label>
                      <Select defaultValue="imperial">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="imperial">Imperial (lbs, acres, °F)</SelectItem>
                          <SelectItem value="metric">Metric (kg, hectares, °C)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger className="w-full md:w-1/2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose how and when you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Alert Types</h4>
                    
                    {[
                      { name: "Critical Alerts", description: "Urgent issues requiring immediate attention", enabled: true },
                      { name: "Weather Warnings", description: "Severe weather conditions", enabled: true },
                      { name: "Equipment Status", description: "Equipment malfunctions and maintenance", enabled: false },
                      { name: "Fertilizer Reminders", description: "Scheduled fertilizer applications", enabled: true },
                      { name: "Harvest Updates", description: "Harvest time and yield predictions", enabled: true },
                      { name: "System Updates", description: "Platform updates and new features", enabled: false }
                    ].map((notification, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{notification.name}</p>
                          <p className="text-sm text-muted-foreground">{notification.description}</p>
                        </div>
                        <Switch defaultChecked={notification.enabled} />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Notification Channels</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>Email Notifications</span>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <span>SMS Notifications</span>
                        </div>
                        <Switch defaultChecked={false} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <span>Push Notifications</span>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Manage your account security and access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Password</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" />
                      </div>
                    </div>
                    <Button variant="outline">
                      <Key className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">SMS Authentication</p>
                        <p className="text-sm text-muted-foreground">Receive codes via SMS</p>
                      </div>
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                        Disabled
                      </Badge>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Active Sessions</h4>
                    <div className="space-y-2">
                      {[
                        { device: "Desktop - Chrome", location: "Iowa, US", current: true },
                        { device: "Mobile - Safari", location: "Iowa, US", current: false },
                      ].map((session, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{session.device}</p>
                            <p className="text-sm text-muted-foreground">{session.location}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.current && (
                              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                                Current
                              </Badge>
                            )}
                            {!session.current && (
                              <Button variant="outline" size="sm">Revoke</Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Management
                  </CardTitle>
                  <CardDescription>Import, export, and manage your farm data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Data Export</h4>
                    <p className="text-sm text-muted-foreground">
                      Download your farm data in various formats for backup or analysis.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export JSON
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF Report
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Data Import</h4>
                    <p className="text-sm text-muted-foreground">
                      Import field data, historical records, or migrate from other systems.
                    </p>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Data Retention</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Historical Data Retention</Label>
                        <Select defaultValue="5years">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1year">1 Year</SelectItem>
                            <SelectItem value="3years">3 Years</SelectItem>
                            <SelectItem value="5years">5 Years</SelectItem>
                            <SelectItem value="forever">Forever</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Backup Frequency</Label>
                        <Select defaultValue="weekly">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-destructive">Danger Zone</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete all your data. This action cannot be undone.
                    </p>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Management
                  </CardTitle>
                  <CardDescription>Manage team members and their access permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Team Members</h4>
                    <Button className="bg-gradient-primary">
                      <Users className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: "John Farmer", email: "john.farmer@example.com", role: "Owner", status: "Active" },
                      { name: "Jane Smith", email: "jane.smith@example.com", role: "Farm Manager", status: "Active" },
                      { name: "Bob Johnson", email: "bob.johnson@example.com", role: "Field Worker", status: "Pending" },
                    ].map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{member.role}</Badge>
                          <Badge 
                            variant="outline" 
                            className={member.status === "Active" ? "bg-accent/10 text-accent border-accent/20" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"}
                          >
                            {member.status}
                          </Badge>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Permissions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 border rounded-lg">
                        <h5 className="font-medium mb-2">Owner</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Full system access</li>
                          <li>• Manage team members</li>
                          <li>• Financial data access</li>
                          <li>• System configuration</li>
                        </ul>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h5 className="font-medium mb-2">Farm Manager</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• View all fields</li>
                          <li>• Manage applications</li>
                          <li>• View reports</li>
                          <li>• Limited settings</li>
                        </ul>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h5 className="font-medium mb-2">Field Worker</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• View assigned fields</li>
                          <li>• Update field status</li>
                          <li>• Basic reporting</li>
                          <li>• No admin access</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="satellite" className="space-y-6">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Satellite className="h-5 w-5" />
                    Satellite API Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure real satellite data APIs for live monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SatelliteAPIConfiguration />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default Settings