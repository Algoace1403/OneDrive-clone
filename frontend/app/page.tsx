'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ChevronRight, Cloud, Search, Play, Monitor, Smartphone, Check, Info } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useTheme } from 'next-themes'

export default function LandingPage() {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSection, setExpandedSection] = useState<string | null>('desktop')
  const [selectedFeature, setSelectedFeature] = useState('backup')
  const { user } = useAuth()
  const router = useRouter()
  const { setTheme } = useTheme()

  useEffect(() => {
    // Force light theme on the landing page
    setTheme('light')
  }, [setTheme])

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const toggleSection = (section: string) => {
    console.log('Toggling section:', section, 'Current:', expandedSection)
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-50">
        <div className="mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[54px]">
            <div className="flex items-center space-x-8">
              {/* Microsoft Logo */}
              <Link href="/" className="flex items-center">
                <div className="grid grid-cols-2 gap-[1px] w-[23px] h-[23px]">
                  <div className="bg-[#f25022]"></div>
                  <div className="bg-[#7fba00]"></div>
                  <div className="bg-[#00a4ef]"></div>
                  <div className="bg-[#ffb900]"></div>
                </div>
                <span className="ml-2 text-[19px] font-semibold">Microsoft</span>
              </Link>
              
              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                <span className="text-lg font-semibold">Microsoft 365</span>
                <Link href="/" className="text-sm hover:underline">OneDrive</Link>
                <Link href="/" className="text-sm hover:underline">Business</Link>
                <button className="flex items-center text-sm hover:underline">
                  Plans and pricing <ChevronRight className="w-4 h-4 ml-1" />
                </button>
                <button className="flex items-center text-sm hover:underline">
                  Features <ChevronRight className="w-4 h-4 ml-1" />
                </button>
                <button className="flex items-center text-sm hover:underline">
                  Resources <ChevronRight className="w-4 h-4 ml-1" />
                </button>
                <Link href="/download" className="text-sm hover:underline">Download</Link>
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-6">
              <button className="text-sm hover:underline hidden lg:block">All Microsoft</button>
              <div className="flex items-center space-x-4">
                <Search className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground" />
                <Link href="/auth/login">
                  <Button 
                    variant="outline" 
                    className="rounded-full px-6"
                  >
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Innovation Banner */}
      <div className="bg-muted py-3 text-center relative">
        <p className="text-sm">
          <span className="font-medium">Learn about our latest innovations coming to OneDrive</span>{' '}
          <Link href="#" className="text-[hsl(var(--primary))] hover:underline font-medium">
            Learn more <ChevronRight className="inline w-3 h-3" />
          </Link>
        </p>
        <button className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xl leading-none">
          ×
        </button>
      </div>

      {/* Main Hero Content */}
      <main className="relative overflow-hidden">
      <img 
              src="/image/img2.png" 
              alt="Microsoft OneDrive Interface"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
      </main>

      {/* Bottom Navigation Tabs */}
      <nav className="border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-8 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`text-sm font-medium pb-4 pt-4 whitespace-nowrap ${
                activeTab === 'overview' 
                  ? 'border-b-2 border-foreground text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('download')}
              className={`text-sm font-medium pb-4 pt-4 whitespace-nowrap ${
                activeTab === 'download' 
                  ? 'border-b-2 border-foreground text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Download the app
            </button>
            <button 
              onClick={() => setActiveTab('explore')}
              className={`text-sm font-medium pb-4 pt-4 whitespace-nowrap ${
                activeTab === 'explore' 
                  ? 'border-b-2 border-foreground text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Explore OneDrive
            </button>
            <button 
              onClick={() => setActiveTab('plans')}
              className={`text-sm font-medium pb-4 pt-4 whitespace-nowrap ${
                activeTab === 'plans' 
                  ? 'border-b-2 border-foreground text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Plans & pricing
            </button>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground pb-4 pt-4">Resources</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground pb-4 pt-4">Microsoft 365 apps</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground pb-4 pt-4">FAQ</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground pb-4 pt-4">Next steps</Link>
            
            <div className="ml-auto flex space-x-4">
              <Link href="/pricing">
                <Button className="bg-foreground text-background hover:opacity-90 rounded-xl">
                  See plans & pricing
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" className="rounded-xl">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <div className="bg-background">
        {activeTab === 'overview' && (
          <>
            {/* Securely save and share section */}
            <section className="py-16 bg-muted">
              <div className="container mx-auto px-6 max-w-7xl">
                <div className="mb-8">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-semibold">OVERVIEW</span>
                  <h2 className="text-[40px] font-light mt-4 leading-tight">
                    Securely save and share what's important
                  </h2>
                </div>

                {/* Feature Pills */}
                <div className="flex flex-wrap gap-2 mb-12">
                  <button 
                    onClick={() => setSelectedFeature('backup')}
                    className={`px-5 py-2 rounded-full text-[13px] font-normal transition-colors ${
                      selectedFeature === 'backup' 
                        ? 'bg-foreground text-background' 
                        : 'bg-secondary text-foreground hover:bg-accent'
                    }`}
                  >
                    Back up and protect
                  </button>
                  <button 
                    onClick={() => setSelectedFeature('access')}
                    className={`px-5 py-2 rounded-full text-[13px] font-normal transition-colors ${
                      selectedFeature === 'access' 
                        ? 'bg-foreground text-background' 
                        : 'bg-secondary text-foreground hover:bg-accent'
                    }`}
                  >
                    Access from anywhere
                  </button>
                  <button 
                    onClick={() => setSelectedFeature('share')}
                    className={`px-5 py-2 rounded-full text-[13px] font-normal transition-colors ${
                      selectedFeature === 'share' 
                        ? 'bg-foreground text-background' 
                        : 'bg-secondary text-foreground hover:bg-accent'
                    }`}
                  >
                    Rediscover and share
                  </button>
                  <button 
                    onClick={() => setSelectedFeature('copilot')}
                    className={`px-5 py-2 rounded-full text-[13px] font-normal transition-colors ${
                      selectedFeature === 'copilot' 
                        ? 'bg-foreground text-background' 
                        : 'bg-secondary text-foreground hover:bg-accent'
                    }`}
                  >
                    Copilot in OneDrive
                  </button>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-16 items-start">
                  {/* Left Column */}
                  <div className="relative">
                    {/* Left border line - half height */}
                    <div className="absolute left-0 top-[20%] bottom-[30%] w-[2px] bg-black"></div>
                    <div className="pl-8 space-y-6">
                      {/* Backup content */}
                      {selectedFeature === 'backup' && (
                        <>
                      {/* Desktop Section */}
                      <div className="pb-6">
                        <button 
                          onClick={() => toggleSection('desktop')}
                          className="flex items-center justify-between w-full group hover:opacity-80 transition-opacity"
                        >
                          <h3 className="text-[18px] font-semibold">For your desktop</h3>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground transform transition-transform duration-200 ${expandedSection === 'desktop' ? 'rotate-90' : ''}`} />
                        </button>
                        {expandedSection === 'desktop' && (
                          <div className="mt-4 pl-4 animate-fadeIn">
                            <p className="text-[14px] text-muted-foreground leading-relaxed mb-4">
                              Back up your important files, photos, apps, and settings
                              so they're available no matter what happens to your
                              device.
                            </p>
                            <Link href="#" className="text-[14px] font-semibold inline-block border-b border-foreground hover:opacity-80 transition-colors">
                              Learn more
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Phone Section */}
                      <div className="border-t border-border pt-6 pb-6">
                        <button 
                          onClick={() => toggleSection('phone')}
                          className="flex items-center justify-between w-full group hover:opacity-80 transition-opacity"
                        >
                          <h3 className="text-[18px] font-semibold">For your phone</h3>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground transform transition-transform duration-200 ${expandedSection === 'phone' ? 'rotate-90' : ''}`} />
                        </button>
                        {expandedSection === 'phone' && (
                          <div className="mt-4 pl-4 animate-fadeIn">
                            <p className="text-[14px] text-muted-foreground leading-relaxed mb-4">
                              Automatically back up the photos and videos on your phone to save space and make them available on your desktop.
                            </p>
                            <Link href="#" className="text-[14px] font-semibold inline-block border-b border-foreground hover:opacity-80 transition-colors">
                              Learn more
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Xbox Section */}
                      <div className="border-t border-border pt-6">
                        <button 
                          onClick={() => toggleSection('xbox')}
                          className="flex items-center justify-between w-full group hover:opacity-80 transition-opacity"
                        >
                          <h3 className="text-[18px] font-semibold">For your Xbox</h3>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground transform transition-transform duration-200 ${expandedSection === 'xbox' ? 'rotate-90' : ''}`} />
                        </button>
                        {expandedSection === 'xbox' && (
                          <div className="mt-4 pl-4 animate-fadeIn">
                            <p className="text-[14px] text-muted-foreground leading-relaxed mb-4">
                              Back up Xbox game captures to keep your best moments protected, shareable, and accessible across all your devices.
                            </p>
                            <Link href="#" className="text-[14px] font-semibold inline-block border-b border-foreground hover:opacity-80 transition-colors">
                              Learn more
                            </Link>
                          </div>
                        )}
                      </div>
                        </>
                      )}

                      {/* Access from anywhere content */}
                      {selectedFeature === 'access' && (
                        <>
                          {/* Access and edit section */}
                          <div className="pb-6">
                            <h3 className="text-[18px] font-semibold mb-4">Access and edit your files from anywhere</h3>
                            <p className="text-[14px] text-muted-foreground leading-relaxed">
                              Changes you make to your files are updated across all your devices and are even accessible offline.
                            </p>
                          </div>

                          {/* Digitize your life section */}
                          <div className="border-t border-border pt-6">
                            <h3 className="text-[18px] font-semibold mb-4">Digitize your life</h3>
                            <p className="text-[14px] text-muted-foreground leading-relaxed mb-4">
                              With the mobile app, scan important documents and meaningful mementos to keep them protected in the cloud.
                            </p>
                            <Link href="#" className="text-[14px] font-semibold inline-block border-b border-foreground hover:opacity-80 transition-colors">
                              Learn more
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column - File Icon */}
                  <div className="flex items-center justify-center h-full py-8">
                    <div className="relative transform scale-110">
                      {/* File Document Icon */}
                      <div className="relative bg-[#f5f5f5] rounded-[20px] shadow-2xl overflow-hidden" style={{ width: '280px', height: '360px' }}>
                        {/* Top folded corner */}
                        <div className="absolute top-0 right-0">
                          <div className="w-0 h-0" 
                            style={{
                              borderStyle: 'solid',
                              borderWidth: '0 60px 60px 0',
                              borderColor: 'transparent #ffffff transparent transparent'
                            }}
                          ></div>
                          <div className="absolute top-0 right-0 w-0 h-0" 
                            style={{
                              borderStyle: 'solid',
                              borderWidth: '0 58px 58px 0',
                              borderColor: 'transparent #d0d0d0 transparent transparent'
                            }}
                          ></div>
                        </div>
                        
                        {/* Inner content */}
                        <div className="p-6 h-full flex flex-col items-center justify-center">
                          {/* Image preview area */}
                          <div className="w-full rounded-[12px] overflow-hidden mb-6 shadow-inner" style={{ height: '140px', backgroundColor: '#e8f4f8' }}>
                            <div className="w-full h-full relative bg-gradient-to-b from-[#87CEEB] to-[#4682B4]">
                              {/* Ocean/sky effect */}
                              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-[#1e3a8a] opacity-30"></div>
                              {/* Rocks */}
                              <div className="absolute bottom-0 left-1/4 w-8 h-6 bg-gray-700 rounded-t-lg"></div>
                              <div className="absolute bottom-0 right-1/3 w-6 h-4 bg-gray-600 rounded-t-lg"></div>
                            </div>
                          </div>
                          
                          {/* Magnifying glass icon */}
                          <div className="mb-6">
                            <div className="bg-gradient-to-b from-[#4a4a4a] to-[#2c2c2c] rounded-full p-5 shadow-xl">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="2" fill="none"/>
                                <path d="M15 15L21 21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="10" cy="10" r="3" fill="white" opacity="0.3"/>
                              </svg>
                            </div>
                          </div>
                          
                          {/* PNG text */}
                          <div className="text-center">
                            <span className="text-[42px] font-medium text-[#666666] tracking-wider">PNG</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'download' && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <span className="text-sm uppercase tracking-wider text-gray-600 font-medium">DOWNLOAD THE APP</span>
                <h2 className="text-4xl font-light text-gray-900 mt-4">
                  OneDrive for all your devices
                </h2>
              </div>

              <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Desktop */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-50 p-6 flex items-center justify-center">
                    <Monitor className="w-24 h-24 text-blue-600" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-medium mb-4">For desktop</h3>
                    <p className="text-gray-700 mb-6">
                      Automatically back up your computer's folders and files with OneDrive.
                    </p>
                    <Button className="bg-black text-white w-full">
                      Learn how <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* iOS */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-300 p-6 flex items-center justify-center">
                    <Cloud className="w-24 h-24 text-white" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-medium mb-4">For iOS</h3>
                    <p className="text-gray-700 mb-6">
                      Automatically save your phone's photos and videos with OneDrive for iOS.
                    </p>
                    <Button className="bg-black text-white w-full">
                      Learn how <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Android */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-green-100 to-green-50 p-6 flex items-center justify-center">
                    <Smartphone className="w-24 h-24 text-green-600" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-medium mb-4">For Android™</h3>
                    <p className="text-gray-700 mb-6">
                      Automatically save your phone's photos and videos with OneDrive for Android™.
                    </p>
                    <Button className="bg-black text-white w-full">
                      Learn how <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'explore' && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <span className="text-sm uppercase tracking-wider text-gray-600 font-medium">EXPLORE ONEDRIVE</span>
                <h2 className="text-4xl font-light text-gray-900 mt-4">
                  Your files and photos, safe and accessible
                </h2>
                <p className="text-xl text-gray-700 mt-4">
                  Securely save, share, and access your files and photos wherever you are.
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <button className="bg-black/80 hover:bg-black text-white rounded-full p-6 transition-colors">
                      <Play className="w-12 h-12 ml-1" fill="white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'plans' && (
          <section className="py-16 bg-gradient-to-br from-pink-50 to-purple-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <span className="text-sm uppercase tracking-wider text-gray-600 font-medium">PLANS & PRICING</span>
                <h2 className="text-4xl font-light text-gray-900 mt-4">
                  OneDrive is better with Microsoft 365
                </h2>
              </div>

              {/* Plan Selector */}
              <div className="flex justify-center gap-4 mb-8">
                <button className="bg-black text-white px-6 py-3 rounded-full text-sm font-medium">
                  For individuals
                </button>
                <button className="bg-white text-gray-700 px-6 py-3 rounded-full text-sm hover:bg-gray-100">
                  For business
                </button>
              </div>

              {/* Billing Toggle */}
              <div className="flex justify-end max-w-6xl mx-auto mb-8">
                <div className="bg-white rounded-full p-1 flex">
                  <button 
                    onClick={() => setSelectedPlan('monthly')}
                    className={`px-4 py-2 rounded-full text-sm ${
                      selectedPlan === 'monthly' 
                        ? 'bg-black text-white' 
                        : 'text-gray-700'
                    }`}
                  >
                    Monthly
                  </button>
                  <button 
                    onClick={() => setSelectedPlan('yearly')}
                    className={`px-4 py-2 rounded-full text-sm ${
                      selectedPlan === 'yearly' 
                        ? 'bg-black text-white' 
                        : 'text-gray-700'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="grid lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {/* Free Plan */}
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <h3 className="text-xl font-medium mb-2">Microsoft 365</h3>
                  <p className="text-3xl font-bold mb-4">Free</p>
                  
                  <div className="mb-6 space-y-2">
                    <Button className="bg-black text-white w-full mb-2">
                      Sign up for free
                    </Button>
                    <Button variant="outline" className="w-full">
                      Sign into your Microsoft account
                    </Button>
                  </div>

                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>For 1 person</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>5 GB of cloud storage</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>15 GB of mailbox storage <Info className="w-4 h-4 inline text-gray-400" /></span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Works on Windows, macOS, iOS, and Android™</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>OneDrive photo and file backup across your devices</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Outlook.com email and calendar</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Web and mobile versions of Word, Excel, PowerPoint, OneNote, OneDrive, and other apps</span>
                    </li>
                  </ul>
                </div>

                {/* Basic Plan */}
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <h3 className="text-xl font-medium mb-2">Microsoft 365 Basic</h3>
                  <p className="text-3xl font-bold mb-1">₹ 149.00</p>
                  <p className="text-sm text-gray-600 mb-4">/month</p>
                  
                  <p className="text-sm mb-4">
                    Subscription automatically renews unless canceled in Microsoft account.{' '}
                    <Link href="#" className="text-blue-600 underline">See terms.</Link>
                  </p>

                  <Button className="bg-black text-white w-full mb-6">
                    Buy now
                  </Button>

                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>For 1 person</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Use on multiple devices at the same time</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Works on web, iOS, and Android</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>100 GB of secure cloud storage</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>OneDrive ransomware protection for your photos and files</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Ad-free secure Outlook web and mobile email and calendar</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Ongoing support for help when you need it</span>
                    </li>
                  </ul>
                </div>

                {/* Personal Plan */}
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <h3 className="text-xl font-medium mb-2">Microsoft 365 Personal</h3>
                  <p className="text-3xl font-bold mb-1">₹ 689.00</p>
                  <p className="text-sm text-gray-600 mb-4">/month</p>
                  
                  <p className="text-sm mb-4">
                    Subscription automatically renews unless canceled in Microsoft account.{' '}
                    <Link href="#" className="text-blue-600 underline">See terms.</Link>
                  </p>

                  <Button className="bg-black text-white w-full mb-6">
                    Buy now
                  </Button>

                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>For 1 person</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Use on up to five devices simultaneously</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Works on PC, Mac, iPhone, iPad, and Android phones and tablets</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>1 TB (1000 GB) of secure cloud storage</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Word, Excel, <Info className="w-4 h-4 inline text-gray-400" /> PowerPoint, Outlook, <Info className="w-4 h-4 inline text-gray-400" /> and OneNote desktop apps with Microsoft Copilot <Info className="w-4 h-4 inline text-gray-400" /></span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Higher usage limits than free for select Copilot features <Info className="w-4 h-4 inline text-gray-400" /></span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Microsoft Designer AI-powered image creator and editor <Info className="w-4 h-4 inline text-gray-400" /></span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Clipchamp video editor with exclusive filters and effects</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Microsoft Defender advanced security for your personal data, and devices</span>
                    </li>
                  </ul>
                </div>

                {/* Family Plan */}
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <h3 className="text-xl font-medium mb-2">Microsoft 365 Family</h3>
                  <p className="text-3xl font-bold mb-1">₹ 819.00</p>
                  <p className="text-sm text-gray-600 mb-4">/month</p>
                  
                  <p className="text-sm mb-4">
                    Subscription automatically renews unless canceled in Microsoft account.{' '}
                    <Link href="#" className="text-blue-600 underline">See terms.</Link>
                  </p>

                  <Button className="bg-black text-white w-full mb-6">
                    Buy now
                  </Button>

                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>For 1 to 6 people</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Each person can use on up to five devices simultaneously</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Works on PC, Mac, iPhone, iPad, and Android phones and tablets</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Up to 6 TB of secure cloud storage (1 TB per person)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Word, Excel, <Info className="w-4 h-4 inline text-gray-400" /> PowerPoint, Outlook, <Info className="w-4 h-4 inline text-gray-400" /> and OneNote desktop apps with Microsoft Copilot <Info className="w-4 h-4 inline text-gray-400" /></span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Higher usage limits than free for select Copilot features <Info className="w-4 h-4 inline text-gray-400" /></span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Microsoft Designer AI-powered image creator and editor <Info className="w-4 h-4 inline text-gray-400" /></span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Clipchamp video editor with exclusive filters and effects</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span>Microsoft Defender advanced security for your personal data, and devices</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Get the OneDrive mobile app section - Always visible at bottom */}
        <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-light text-gray-900 mb-4">
                Get the OneDrive mobile app
              </h2>
              <p className="text-xl text-gray-700">
                Access, edit, or share your photos and files from anywhere with the OneDrive mobile app.
              </p>
            </div>

            <div className="flex justify-center gap-4 mb-12">
              <Button className="bg-black text-white px-8 py-3">
                Download for iOS
              </Button>
              <Button variant="outline" className="border-black px-8 py-3">
                Download for Android™
              </Button>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="w-48 h-48 bg-black/5 flex items-center justify-center">
                  <span className="text-4xl">📱</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-sm uppercase tracking-wider text-gray-600 font-medium mb-8">
              RESOURCES
            </h2>
            
            <div className="grid lg:grid-cols-4 gap-8">
              <div>
                <h3 className="font-medium mb-4">What's new</h3>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Surface Pro</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Surface Laptop</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Surface Laptop Studio 2</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Surface Laptop Go 3</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Microsoft Copilot</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Microsoft 365</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Windows 11 apps</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-4">Microsoft Store</h3>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Account profile</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Download Center</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Microsoft Store Support</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Returns</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Order tracking</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Certified Refurbished</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Microsoft Store Promise</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-4">Education</h3>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Microsoft in education</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Devices for education</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Microsoft Teams for Education</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Microsoft 365 Education</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Education consultation appointment</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Educator training</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Deals for students and parents</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-4">Business</h3>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Microsoft Cloud</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Microsoft Security</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Dynamics 365</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Microsoft 365</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Microsoft Power Platform</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Microsoft Teams</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:underline text-sm">Copilot for Microsoft 365</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 border-t">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-600">
            © 2024 Microsoft OneDrive Clone - Built for demonstration purposes
          </p>
        </div>
      </footer>
    </div>
  )
}
